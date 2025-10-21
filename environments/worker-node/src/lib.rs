use std::{path::PathBuf, time::Duration};

use anyhow::{Context, Result};
use codec::QpbRRCodec;
use futures::StreamExt;
use libp2p::swarm::{NetworkBehaviour, SwarmEvent};
use libp2p::{Multiaddr, PeerId, StreamProtocol, Swarm, noise, tcp, yamux};
use libp2p_request_response as rr;
use proto::common::CtrlAck;
use proto::task::TaskCtrlReq;
use proto::{ack_err, ack_ok, now_ms, now_timestamp_i32};
use serde_json::json;
use tokio::sync::oneshot;
use tokio::task::JoinHandle;
use storage::{ReceiptDb, ReceiptStore, Store, TaskStore, LoadedTask};
use domain::receipt::TaskReceipt;
use domain::task::{TaskPayload, TaskMessage};
use net::task::{TaskInbound, TaskOutbound, TaskDecodeError};
use workflow::Event;

const CTRL_PROTOCOL: &str = "/effect/task-ctrl/1";

#[derive(NetworkBehaviour)]
struct WorkerBehaviour {
    ctrl: rr::Behaviour<QpbRRCodec<TaskCtrlReq, CtrlAck>>,
}

#[derive(Debug, Clone)]
pub struct WorkerConfig {
    pub manager_addr: Multiaddr,
    pub data_dir: PathBuf,
}

pub struct WorkerHandle {
    shutdown_tx: Option<oneshot::Sender<()>>,
    join_handle: JoinHandle<Result<()>>,
    receipts: ReceiptDb,
    tasks: Store,
}

impl WorkerHandle {
    pub async fn shutdown(mut self) -> Result<()> {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        match self.join_handle.await {
            Ok(result) => result,
            Err(err) => Err(err.into()),
        }
    }

    pub fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        self.receipts.list_receipts()
    }

    pub fn load_tasks(&self) -> Result<Vec<LoadedTask>> {
        self.tasks.load_active_tasks()
    }
}

pub async fn spawn_worker(config: WorkerConfig) -> Result<WorkerHandle> {
    let (shutdown_tx, shutdown_rx) = oneshot::channel();
    let receipts = ReceiptDb::open(config.data_dir.join("receipts"))?;
    let tasks_store = Store::open(config.data_dir.join("tasks"))?;
    let worker_receipts = receipts.clone();
    let worker_tasks = tasks_store.clone();
    let join_handle = tokio::spawn(run_worker(config, worker_receipts, worker_tasks, shutdown_rx));
    Ok(WorkerHandle {
        shutdown_tx: Some(shutdown_tx),
        join_handle,
        receipts,
        tasks: tasks_store,
    })
}

async fn run_worker(
    config: WorkerConfig,
    receipt_store: ReceiptDb,
    task_store: Store,
    mut shutdown_rx: oneshot::Receiver<()>,
) -> Result<()> {
    let mut swarm = build_swarm()?;
    swarm
        .dial(config.manager_addr.clone())
        .context("failed to dial manager")?;

    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::Behaviour(WorkerBehaviourEvent::Ctrl(event)) => {
                        handle_rr_event(&receipt_store, &task_store, &mut swarm, event);
                    }
                    other => tracing::trace!(?other, "worker swarm event"),
                }
            }
            _ = &mut shutdown_rx => {
                tracing::info!("Worker shutting down");
                break;
            }
        }
    }

    Ok(())
}

fn handle_rr_event(
    receipt_store: &ReceiptDb,
    task_store: &Store,
    swarm: &mut Swarm<WorkerBehaviour>,
    event: rr::Event<TaskCtrlReq, CtrlAck>,
) {
    match event {
        rr::Event::Message { peer, message, .. } => match message {
            rr::Message::Request {
                request, channel, ..
            } => {
                let response = match TaskInbound::try_from(request) {
                    Ok(TaskInbound::Payload(payload)) => {
                        let id = payload.id.clone();
                        let title = payload.title.clone();
                        tracing::info!(%peer, %id, %title, "Worker received task payload");
                        persist_task_payload(task_store, &payload);
                        let _ = swarm.behaviour_mut().ctrl.send_response(channel, ack_ok());

                        let accept_value = json!({ "status": "accepted", "ts": now_ms() });
                        record_task_event(
                            task_store,
                            &id,
                            Event {
                                name: "WorkerAccepted".into(),
                                payload: accept_value.clone(),
                            },
                            "Accepted",
                            false,
                        );
                        let accept_message = TaskMessage {
                            task_id: id.clone(),
                            message_type: "accept".into(),
                            data: serde_json::to_vec(&accept_value).unwrap_or_default(),
                            timestamp: now_timestamp_i32(),
                        };
                        send_task_message(swarm, &peer, accept_message);

                        let completion_value = json!({ "result": "dummy result", "ts": now_ms() });
                        record_task_event(
                            task_store,
                            &id,
                            Event {
                                name: "WorkerCompleted".into(),
                                payload: completion_value.clone(),
                            },
                            "Completed",
                            true,
                        );
                        let completion_message = TaskMessage {
                            task_id: id.clone(),
                            message_type: "completed".into(),
                            data: serde_json::to_vec(&completion_value).unwrap_or_default(),
                            timestamp: now_timestamp_i32(),
                        };
                        send_task_message(swarm, &peer, completion_message);

                        return;
                    }
                    Ok(TaskInbound::Message(message)) => {
                        tracing::info!(
                            %peer,
                            task_id = %message.task_id,
                            event = %message.message_type,
                            "Worker received task message"
                        );
                        ack_ok()
                    }
                    Ok(TaskInbound::Receipt(receipt)) => {
                        match receipt_store.put_receipt(&receipt) {
                            Ok(_) => tracing::info!(
                                %peer,
                                task_id = %receipt.task_id,
                                "Worker stored task receipt"
                            ),
                            Err(err) => tracing::error!(
                                %peer,
                                task_id = %receipt.task_id,
                                ?err,
                                "Worker failed to persist task receipt"
                            ),
                        }
                        tracing::info!(
                            %peer,
                            task_id = %receipt.task_id,
                            "Worker received task receipt"
                        );
                        ack_ok()
                    }
                    Err(TaskDecodeError::Empty) => ack_err(400, "empty TaskCtrlReq"),
                };

                if swarm
                    .behaviour_mut()
                    .ctrl
                    .send_response(channel, response)
                    .is_err()
                {
                    tracing::warn!(%peer, "Worker failed to send response");
                }
            }
            rr::Message::Response {
                request_id,
                response,
            } => {
                tracing::info!(%peer, ?request_id, ?response, "Worker received response");
            }
        },
        rr::Event::OutboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Worker outbound failure");
        }
        rr::Event::InboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Worker inbound failure");
        }
        rr::Event::ResponseSent { peer, .. } => {
            tracing::debug!(%peer, "Worker response sent");
        }
    }
}

fn send_task_message(
    swarm: &mut Swarm<WorkerBehaviour>,
    peer: &PeerId,
    message: TaskMessage,
) {
    let request: TaskCtrlReq = TaskOutbound::Message(message.clone()).into();
    let request_id = swarm.behaviour_mut().ctrl.send_request(peer, request);
    tracing::debug!(task_id = %message.task_id, event = %message.message_type, ?request_id, "Worker sent task update");
}

fn persist_task_payload(store: &Store, payload: &TaskPayload) {
    if let Err(err) = store.persist_active_task(&payload.id, payload, &[], "Received", false) {
        tracing::error!(task_id = %payload.id, ?err, "Worker failed to persist task payload");
    }
}

fn record_task_event(store: &Store, task_id: &str, event: Event, state: &str, completed: bool) {
    match store.load_active_tasks() {
        Ok(tasks) => {
            if let Some(record) = tasks.into_iter().find(|t| t.payload.id == task_id) {
                let mut events = record.events;
                events.push(event);
                if let Err(err) = store.persist_active_task(task_id, &record.payload, &events, state, completed) {
                    tracing::error!(%task_id, ?err, "Worker failed to update task state");
                }
            } else {
                tracing::warn!(%task_id, "Worker missing task record while recording event");
            }
        }
        Err(err) => tracing::error!(%task_id, ?err, "Worker failed to load task state"),
    }
}

fn build_swarm() -> Result<Swarm<WorkerBehaviour>> {
    Ok(libp2p::SwarmBuilder::with_new_identity()
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_behaviour(|_| WorkerBehaviour {
            ctrl: rr::Behaviour::with_codec(
                QpbRRCodec::<TaskCtrlReq, CtrlAck>::default(),
                [(
                    StreamProtocol::new(CTRL_PROTOCOL),
                    rr::ProtocolSupport::Full,
                )],
                rr::Config::default(),
            ),
        })?
        .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(30)))
        .build())
}
