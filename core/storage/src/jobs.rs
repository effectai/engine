use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSequenceSubmission {
    pub title: String,
    pub reward: u64,
    pub time_limit_seconds: u32,
    pub capability: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequenceRecord {
    pub id: String,
    pub application_id: String,
    pub step_order: Vec<String>,
    pub current_step: usize,
    pub submission: StoredSequenceSubmission,
    #[serde(default)]
    pub context: HashMap<String, Value>,
}

pub trait JobStore {
    fn persist_job(&self, job: &SequenceRecord) -> Result<()>;
    fn load_jobs(&self) -> Result<Vec<SequenceRecord>>;
    fn get_job(&self, job_id: &str) -> Result<Option<SequenceRecord>>;
    fn remove_job(&self, job_id: &str) -> Result<()>;
}
