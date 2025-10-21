use crate::application::ApplicationStep;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use proto::task as proto_task;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskPayload {
    pub id: String,
    pub title: String,
    pub reward: u64,
    pub time_limit_seconds: u32,
    pub template_id: String,
    pub template_data: String,
    pub application_id: String,
    pub step_id: String,
    pub capability: String,
}

impl TaskPayload {
    pub fn from_proto(payload: &proto_task::TaskPayload) -> Self {
        Self {
            id: payload.id.clone(),
            title: payload.title.clone(),
            reward: payload.reward,
            time_limit_seconds: payload.time_limit_seconds,
            template_id: payload.template_id.clone(),
            template_data: payload.template_data.clone(),
            application_id: payload.application_id.clone(),
            step_id: payload.step_id.clone(),
            capability: payload.capability.clone(),
        }
    }

    pub fn into_proto(self) -> proto_task::TaskPayload {
        proto_task::TaskPayload {
            id: self.id,
            title: self.title,
            reward: self.reward,
            time_limit_seconds: self.time_limit_seconds,
            template_id: self.template_id,
            template_data: self.template_data,
            application_id: self.application_id,
            step_id: self.step_id,
            capability: self.capability,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskEvent {
    pub name: String,
    pub payload: Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskInstance {
    pub payload: TaskPayload,
    pub events: Vec<TaskEvent>,
    pub current_state: String,
    pub completed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskMessage {
    pub task_id: String,
    pub message_type: String,
    pub data: Vec<u8>,
    pub timestamp: i32,
}

impl TaskSubmission {
    pub fn with_step_defaults(self, step: &ApplicationStep) -> Self {
        let capability = self.capability.or_else(|| step.capabilities.first().cloned());
        Self {
            capability,
            ..self
        }
    }

    pub fn from_proto(payload: proto_task::TaskPayload) -> Self {
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

impl TaskMessage {
    pub fn from_proto(message: proto_task::TaskMessage) -> Self {
        Self {
            task_id: message.task_id,
            message_type: message.type_pb,
            data: message.data,
            timestamp: message.timestamp,
        }
    }

    pub fn into_proto(self) -> proto_task::TaskMessage {
        proto_task::TaskMessage {
            task_id: self.task_id,
            type_pb: self.message_type,
            data: self.data,
            timestamp: self.timestamp,
        }
    }
}
