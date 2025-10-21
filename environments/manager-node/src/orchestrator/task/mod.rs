use std::collections::{HashMap, HashSet, VecDeque};
use std::convert::TryInto;
use std::str::FromStr;
use std::sync::Arc;

use anyhow::{Result, anyhow};
use ark_serialize::CanonicalSerialize;
use libp2p::{PeerId, Swarm};
use serde_json::{Value, json};
use tokio::sync::mpsc::{self, UnboundedReceiver, UnboundedSender};
use ulid::Ulid;

use crate::manager::EffectBehaviour;
use crate::sequencer::{JobNotification, Sequencer};
use application::Application;
use domain::receipt::{ManagerPublicKey, ManagerSignature, TaskReceipt};
use domain::task::{TaskPayload, TaskSubmission};
use domain::workflow::DelegationStrategy;
use libp2p_request_response as rr;
use net::task::{TaskDecodeError, TaskInbound, TaskOutbound};
use proto::common::CtrlAck;
use proto::task::TaskCtrlReq;
use proto::{ack_err, ack_ok, now_ms};
use rand::{SeedableRng, rngs::StdRng};
use storage::{ApplicationRecord, ApplicationStore, CompletedTask, LoadedTask, Store, TaskStore};
use workflow::{self, DEFAULT_WORKFLOW_ID, Engine, Event, WorkflowAction};
use zkp::{ManagerKeypair, pack_receipt};

mod assignment;
mod messaging;
mod storage_state;

pub use assignment::NetworkAction;
pub use messaging::RequestOutcome;

pub struct TaskOrchestrator {
    store: Arc<Store>,
    engine: Engine,
    pending_assignments: VecDeque<String>,
    idle_workers: VecDeque<PeerId>,
    connected_workers: HashSet<PeerId>,
    task_assignments: HashMap<String, PeerId>,
    task_policies: HashMap<String, DelegationStrategy>,
    broadcast_targets: HashMap<String, HashSet<PeerId>>,
    workflow_tx: UnboundedSender<WorkflowAction>,
    workflow_rx: UnboundedReceiver<WorkflowAction>,
    applications: HashMap<String, Application>,
    job_notifier: Option<UnboundedSender<JobNotification>>,
    receipt_keypair: ManagerKeypair,
    receipt_rng: StdRng,
    receipt_tree_depth: usize,
}

fn merge_template_with_context(base: &str, context: &serde_json::Value) -> String {
    let template_value =
        serde_json::from_str(base).unwrap_or_else(|_| serde_json::Value::String(base.to_string()));
    json!({
        "template": template_value,
        "context": context,
    })
    .to_string()
}

const RECEIPT_TREE_DEPTH: usize = 21;

impl TaskOrchestrator {
    pub fn new(store: Arc<Store>, receipt_keypair: ManagerKeypair) -> Result<Self> {
        let (tx, rx) = mpsc::unbounded_channel();
        let engine = Engine::new();

        let mut orchestrator = Self {
            store,
            engine,
            pending_assignments: VecDeque::new(),
            idle_workers: VecDeque::new(),
            connected_workers: HashSet::new(),
            task_assignments: HashMap::new(),
            task_policies: HashMap::new(),
            broadcast_targets: HashMap::new(),
            workflow_tx: tx.clone(),
            workflow_rx: rx,
            applications: HashMap::new(),
            job_notifier: None,
            receipt_keypair,
            receipt_rng: StdRng::from_entropy(),
            receipt_tree_depth: RECEIPT_TREE_DEPTH,
        };

        // build default workflow
        let default_workflow = workflow::build_default_workflow(tx);
        orchestrator.engine.register(default_workflow);

        orchestrator.restore_from_storage()?;
        Ok(orchestrator)
    }

    pub fn set_job_notifier(&mut self, tx: UnboundedSender<JobNotification>) {
        self.job_notifier = Some(tx);
    }

    pub fn application(&mut self, application_id: &str) -> Result<Application> {
        self.require_application(application_id)
            .map(|app| app.clone())
    }

    pub fn register_application(&mut self, application: Application) -> Result<()> {
        self.register_application_internal(application, true)
    }

    pub fn has_task(&self, task_id: &str) -> bool {
        self.engine.get(&task_id.to_string()).is_some()
    }

    pub fn create_task(&mut self, submission: TaskSubmission) -> Result<Vec<NetworkAction>> {
        let application_id = submission.application_id.clone();
        let step_id = submission.step_id.clone();
        let step = {
            let application = self.require_application(&application_id)?;
            application.step(&step_id).cloned().ok_or_else(|| {
                anyhow!(
                    "unknown step {} for application {}",
                    step_id,
                    application_id
                )
            })?
        };

        //TODO:: support custom workflows
        let engine_workflow_id = DEFAULT_WORKFLOW_ID;

        let submission = submission.with_step_defaults(&step);
        let capability = submission.capability.clone().unwrap_or_default();

        let base_template = submission
            .template_data
            .clone()
            .unwrap_or_else(|| step.data.clone());

        let template_data = if let Some(context) = submission.job_context.as_ref() {
            let include_context = context
                .as_object()
                .map(|map| !map.is_empty())
                .unwrap_or(false);
            if include_context {
                merge_template_with_context(&base_template, context)
            } else {
                base_template.clone()
            }
        } else {
            base_template.clone()
        };

        let domain_payload = TaskPayload {
            id: submission.id.clone(),
            title: submission.title.clone(),
            reward: submission.reward,
            time_limit_seconds: submission.time_limit_seconds,
            template_id: step.template_id.clone(),
            template_data,
            application_id: submission.application_id.clone(),
            step_id: submission.step_id.clone(),
            capability: capability.clone(),
        };

        let payload_proto = domain_payload.clone().into_proto();

        let task_id = domain_payload.id.clone();
        self.task_policies.insert(task_id.clone(), step.delegation);
        self.broadcast_targets.remove(&task_id);
        self.engine
            .create_task(engine_workflow_id, task_id.clone(), payload_proto);
        self.enqueue_task(task_id.clone());
        self.persist_task_state(&task_id);
        self.consume_workflow_actions();
        Ok(self.assign_ready_tasks())
    }

    pub fn on_tick(&mut self, now_ms: u64) -> Vec<NetworkAction> {
        self.engine.tick(now_ms);
        self.consume_workflow_actions();
        self.assign_ready_tasks()
    }

    pub fn completed_tasks(&self) -> Result<Vec<CompletedTask>> {
        self.store.load_completed_tasks()
    }

    fn register_application_internal(
        &mut self,
        application: Application,
        persist: bool,
    ) -> Result<()> {
        if persist {
            let record = ApplicationRecord::from_domain(&application);
            self.store.put_application(&record)?;
        }

        self.applications
            .insert(application.id.clone(), application);
        Ok(())
    }

    fn require_application(&mut self, application_id: &str) -> Result<&Application> {
        if !self.applications.contains_key(application_id) {
            if let Some(record) = self.store.get_application(application_id)? {
                let application = record.into_domain();
                self.register_application_internal(application, false)?;
            }
        }

        self.applications
            .get(application_id)
            .ok_or_else(|| anyhow!("unknown application {application_id}"))
    }

    fn enqueue_task(&mut self, task_id: String) {
        if !self.pending_assignments.iter().any(|id| id == &task_id) {
            self.pending_assignments.push_back(task_id);
        }
    }

    fn record_event(&mut self, task_id: &str, event: Event) {
        let key = task_id.to_string();
        self.engine.submit_event(&key, event);
        self.persist_task_state(&key);
        self.consume_workflow_actions();
    }

    fn persist_task_state(&self, task_id: &String) {
        if let Some(task) = self.engine.get(task_id) {
            let domain_payload = domain::task::TaskPayload::from_proto(&task.payload);
            if let Err(err) = self.store.persist_active_task(
                task_id,
                &domain_payload,
                task.events(),
                task.current,
                task.completed,
            ) {
                tracing::error!(%task_id, ?err, "Failed to persist task state");
            }
        }
    }

    fn archive_task(&self, task_id: &str, result: Value) {
        let key = task_id.to_string();
        if let Some(task) = self.engine.get(&key) {
            let domain_payload = domain::task::TaskPayload::from_proto(&task.payload);
            if let Err(err) =
                self.store
                    .archive_task(&key, &domain_payload, task.events(), result, now_ms())
            {
                tracing::error!(%task_id, ?err, "Failed to archive task");
            }
        }
    }

    fn build_receipt(&mut self, task_id: &str) -> Option<TaskReceipt> {
        let key = task_id.to_string();
        let task = self.engine.get(&key)?;

        let numeric_id = match Self::receipt_numeric_id(&task.payload.id) {
            Some(value) => value,
            None => {
                tracing::warn!(
                    task_id = %task.payload.id,
                    "Failed to derive numeric id for receipt"
                );
                return None;
            }
        };

        let duration = task.payload.time_limit_seconds as u64;
        let (receipt, _) = pack_receipt(
            &mut self.receipt_rng,
            &self.receipt_keypair,
            numeric_id,
            task.payload.reward,
            duration,
            self.receipt_tree_depth,
        );

        Some(TaskReceipt {
            task_id: task.payload.id.clone(),
            reward: task.payload.reward,
            duration,
            signature: ManagerSignature {
                r_x: field_to_bytes(&receipt.signature.r_x),
                r_y: field_to_bytes(&receipt.signature.r_y),
                s: field_to_bytes(&receipt.signature.s),
            },
            manager: ManagerPublicKey {
                x: field_to_bytes(&receipt.manager_public.x),
                y: field_to_bytes(&receipt.manager_public.y),
            },
            nullifier: field_to_bytes(&receipt.nullifier),
        })
    }

    fn receipt_numeric_id(task_id: &str) -> Option<u64> {
        let base_id = task_id.split("::").next().unwrap_or(task_id);

        Ulid::from_str(base_id)
            .ok()
            .and_then(|ulid| bytes_to_u64(ulid.to_bytes()))
    }
}

impl TaskOrchestrator {
    fn consume_workflow_actions(&mut self) {
        while let Ok(action) = self.workflow_rx.try_recv() {
            match action {
                WorkflowAction::Assign { task_id } => {
                    self.task_assignments.remove(&task_id);
                    self.broadcast_targets.remove(&task_id);
                    self.enqueue_task(task_id);
                }
                WorkflowAction::Completed { task_id } => {
                    self.task_assignments.remove(&task_id);
                    self.pending_assignments.retain(|id| id != &task_id);
                    self.broadcast_targets.remove(&task_id);
                    self.task_policies.remove(&task_id);
                    self.persist_task_state(&task_id);
                }
                WorkflowAction::TimedOut { task_id } => {
                    self.task_assignments.remove(&task_id);
                    self.broadcast_targets.remove(&task_id);
                    self.enqueue_task(task_id.clone());
                    self.persist_task_state(&task_id);
                }
            }
        }
    }
}

fn field_to_bytes<F: CanonicalSerialize>(value: &F) -> Vec<u8> {
    let mut bytes = Vec::new();
    value
        .serialize_compressed(&mut bytes)
        .expect("field serialization");
    bytes
}

fn bytes_to_u64(bytes: [u8; 16]) -> Option<u64> {
    let tail: [u8; 8] = bytes[8..16].try_into().ok()?;
    Some(u64::from_be_bytes(tail))
}

impl TaskOrchestrator {
    pub fn handle_worker_connected(&mut self, peer: PeerId) -> Vec<NetworkAction> {
        if self.connected_workers.insert(peer.clone()) {
            self.idle_workers.push_back(peer.clone());
        }
        self.consume_workflow_actions();
        self.assign_ready_tasks()
    }

    pub fn handle_worker_disconnected(&mut self, peer: &PeerId) -> Vec<NetworkAction> {
        self.connected_workers.remove(peer);
        self.idle_workers.retain(|p| p != peer);
        for targets in self.broadcast_targets.values_mut() {
            targets.remove(peer);
        }

        let mut affected_tasks = Vec::new();
        self.task_assignments.retain(|task_id, assigned| {
            if assigned == peer {
                affected_tasks.push(task_id.clone());
                false
            } else {
                true
            }
        });

        for task_id in &affected_tasks {
            self.enqueue_task(task_id.clone());
            self.record_event(
                task_id,
                Event {
                    name: "WorkerRejected".into(),
                    payload: json!({
                        "peer": peer.to_string(),
                        "reason": "disconnect",
                        "ts": now_ms(),
                    }),
                },
            );
        }

        self.assign_ready_tasks()
    }
}

pub fn handle_rr_event(
    swarm: &mut Swarm<EffectBehaviour>,
    orchestrator: &mut TaskOrchestrator,
    job_sequencer: &mut Sequencer,
    event: rr::Event<TaskCtrlReq, CtrlAck>,
) {
    match event {
        rr::Event::Message { peer, message, .. } => match message {
            rr::Message::Request {
                request, channel, ..
            } => {
                let outcome = match TaskInbound::try_from(request) {
                    Ok(TaskInbound::Payload(payload)) => {
                        match job_sequencer
                            .submit_job(orchestrator, messaging::submission_from_payload(payload))
                        {
                            Ok(actions) => RequestOutcome {
                                response: ack_ok(),
                                actions,
                            },
                            Err(err) => RequestOutcome {
                                response: ack_err(400, err.to_string()),
                                actions: Vec::new(),
                            },
                        }
                    }
                    Ok(TaskInbound::Message(message)) => {
                        orchestrator.handle_task_message(&peer, message)
                    }
                    Ok(TaskInbound::Receipt(_)) => RequestOutcome {
                        response: ack_err(400, "unexpected task receipt payload"),
                        actions: Vec::new(),
                    },
                    Err(TaskDecodeError::Empty) => RequestOutcome {
                        response: ack_err(400, "empty TaskCtrlReq"),
                        actions: Vec::new(),
                    },
                };

                if swarm
                    .behaviour_mut()
                    .task_ctrl
                    .send_response(channel, outcome.response)
                    .is_err()
                {
                    tracing::warn!(%peer, "Failed to send response; channel dropped");
                }

                execute_actions(swarm, outcome.actions);
            }
            rr::Message::Response {
                request_id,
                response,
            } => {
                tracing::info!(%peer, ?request_id, ?response, "Received control response");
            }
        },
        rr::Event::InboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Inbound control error");
        }
        rr::Event::OutboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Outbound control error");
        }
        rr::Event::ResponseSent { peer, .. } => {
            tracing::debug!(%peer, "Control response sent");
        }
    }
}

fn execute_actions(swarm: &mut Swarm<EffectBehaviour>, actions: Vec<NetworkAction>) {
    for action in actions {
        match action {
            NetworkAction::SendTask { peer, payload } => {
                let request: TaskCtrlReq = TaskOutbound::Payload(payload).into();
                let request_id = swarm.behaviour_mut().task_ctrl.send_request(&peer, request);
                tracing::info!(%peer, ?request_id, "Sent task payload");
            }
            NetworkAction::SendReceipt { peer, receipt } => {
                let request: TaskCtrlReq = TaskOutbound::Receipt(receipt).into();
                let request_id = swarm.behaviour_mut().task_ctrl.send_request(&peer, request);
                tracing::info!(%peer, ?request_id, "Sent task receipt");
            }
        }
    }
}
