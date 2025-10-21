use anyhow::Result;
use domain::task::TaskPayload;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use workflow::Event;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct StoredTaskPayload {
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

impl StoredTaskPayload {
    pub fn from_domain(payload: &TaskPayload) -> Self {
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

    pub fn into_domain(self) -> TaskPayload {
        TaskPayload {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct StoredTask {
    pub payload: StoredTaskPayload,
    pub events: Vec<Event>,
    pub current_state: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct StoredCompletedTask {
    pub payload: StoredTaskPayload,
    pub events: Vec<Event>,
    pub result: Value,
    pub finished_at: u64,
}

#[derive(Debug, Clone)]
pub struct LoadedTask {
    pub payload: TaskPayload,
    pub events: Vec<Event>,
    pub current_state: String,
    pub completed: bool,
}

#[derive(Debug, Clone)]
pub struct CompletedTask {
    pub payload: TaskPayload,
    pub events: Vec<Event>,
    pub result: Value,
    pub finished_at: u64,
}

pub trait TaskStore {
    fn persist_active_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        current_state: &str,
        completed: bool,
    ) -> Result<()>;

    fn load_active_tasks(&self) -> Result<Vec<LoadedTask>>;

    fn archive_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        result: Value,
        finished_at: u64,
    ) -> Result<()>;

    fn load_completed_tasks(&self) -> Result<Vec<CompletedTask>>;

    fn remove_active_task(&self, task_id: &str) -> Result<()>;
}
