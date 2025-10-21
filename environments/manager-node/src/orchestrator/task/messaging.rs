use application::DelegationStrategy;
use libp2p::PeerId;
use proto::common::CtrlAck;
use proto::task::{TaskCtrlReq, TaskMessage, TaskPayload};
use proto::{ack_err, ack_ok};
use serde_json::{Value, json};
use workflow::Event;

use crate::sequencer::JobNotification;

use super::{NetworkAction, TaskOrchestrator};

#[derive(Debug, Clone)]
pub struct TaskSubmission {
    pub id: String,
    pub title: String,
    pub reward: u64,
    pub time_limit_seconds: u32,
    pub application_id: String,
    pub step_id: String,
    pub capability: Option<String>,
    pub template_data: Option<String>,
    pub job_context: Option<Value>,
}

impl TaskSubmission {
    pub fn from_payload(payload: TaskPayload) -> Self {
        Self {
            id: payload.id,
            title: payload.title,
            reward: payload.reward,
            time_limit_seconds: payload.time_limit_seconds,
            application_id: payload.application_id,
            step_id: payload.step_id,
            capability: Some(payload.capability),
            template_data: Some(payload.template_data),
            job_context: None,
        }
    }
}

#[derive(Debug)]
pub struct RequestOutcome {
    pub response: CtrlAck,
    pub actions: Vec<NetworkAction>,
}

impl TaskOrchestrator {
    pub fn handle_request(&mut self, peer: &PeerId, request: TaskCtrlReq) -> RequestOutcome {
        match request.kind {
            proto::task::mod_TaskCtrlReq::OneOfkind::task_payload(payload) => {
                match self.create_task(TaskSubmission::from_payload(payload)) {
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
            proto::task::mod_TaskCtrlReq::OneOfkind::task_message(message) => {
                self.handle_task_message(peer, message)
            }
            proto::task::mod_TaskCtrlReq::OneOfkind::None => RequestOutcome {
                response: ack_err(400, "empty TaskCtrlReq"),
                actions: Vec::new(),
            },
        }
    }

    pub fn handle_task_message(&mut self, peer: &PeerId, message: TaskMessage) -> RequestOutcome {
        let TaskMessage {
            task_id,
            type_pb,
            data,
            timestamp,
        } = message;

        let peer_str = peer.to_string();

        let Some(task) = self.engine.get(&task_id) else {
            return RequestOutcome {
                response: ack_err(404, format!("task {task_id} not found")),
                actions: Vec::new(),
            };
        };

        let payload_value = decode_payload(&data);
        let assignee = workflow::current_assignee(task.events());

        let mut actions = Vec::new();
        let response = match type_pb.as_str() {
            "accept" => {
                self.idle_workers.retain(|p| p != peer);
                self.task_assignments.insert(task_id.clone(), peer.clone());
                self.broadcast_targets.remove(&task_id);

                self.record_event(
                    &task_id,
                    Event {
                        name: "WorkerAccepted".into(),
                        payload: json!({
                            "peer": peer_str,
                            "timestamp": timestamp,
                            "details": payload_value,
                        }),
                    },
                );
                actions.extend(self.assign_ready_tasks());
                ack_ok()
            }
            "reject" => {
                if assignee.as_deref() != Some(peer_str.as_str()) {
                    ack_err(403, format!("peer {peer} not assigned to task {task_id}"))
                } else {
                    self.record_event(
                        &task_id,
                        Event {
                            name: "WorkerRejected".into(),
                            payload: json!({
                                "peer": peer_str.clone(),
                                "timestamp": timestamp,
                                "details": payload_value.clone(),
                            }),
                        },
                    );
                    self.task_assignments.remove(&task_id);
                    self.idle_workers.push_back(peer.clone());
                    self.enqueue_task(task_id.clone());
                    actions.extend(self.assign_ready_tasks());
                    ack_ok()
                }
            }
            "completed" => {
                if !workflow::can_complete(task.events()) {
                    ack_err(
                        409,
                        format!("task {task_id} has not been accepted; cannot complete"),
                    )
                } else {
                    let application_id = task.payload.application_id.clone();
                    let completed_step_id = task.payload.step_id.clone();
                    let result_value = payload_value.clone();
                    self.record_event(
                        &task_id,
                        Event {
                            name: "WorkerCompleted".into(),
                            payload: json!({
                                "peer": peer_str.clone(),
                                "timestamp": timestamp,
                                "result": result_value.clone(),
                            }),
                        },
                    );
                    self.task_assignments.remove(&task_id);
                    self.idle_workers.push_back(peer.clone());
                    actions.extend(self.assign_ready_tasks());
                    self.archive_task(&task_id, result_value.clone());

                    if let Some(tx) = self.job_notifier.clone() {
                        let _ = tx.send(JobNotification::StepCompleted {
                            task_id: task_id.clone(),
                            application_id,
                            step_id: completed_step_id,
                            result: result_value,
                        });
                    }

                    ack_ok()
                }
            }
            other => ack_err(400, format!("unsupported task message type {other}")),
        };

        RequestOutcome { response, actions }
    }
}

fn decode_payload(bytes: &[u8]) -> serde_json::Value {
    if bytes.is_empty() {
        return serde_json::Value::Null;
    }

    if let Ok(value) = serde_json::from_slice(bytes) {
        return value;
    }

    match std::str::from_utf8(bytes) {
        Ok(text) => serde_json::Value::String(text.to_string()),
        Err(_) => serde_json::Value::Null,
    }
}
