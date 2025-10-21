use std::collections::HashMap;
use std::fs;
use std::path::Path;

use anyhow::{Context, Result};
use proto::task::{TaskPayload, TaskReceipt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sled::Db;
use workflow::Event;
use quick_protobuf::{BytesReader, MessageRead, MessageWrite, Writer};

const TREE_ACTIVE: &str = "active";
const TREE_COMPLETED: &str = "completed";
const TREE_APPLICATIONS: &str = "applications";
const TREE_JOBS: &str = "jobs";
const TREE_RECEIPTS: &str = "receipts";

pub trait ReceiptStore {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()>;
    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>>;
    fn list_receipts(&self) -> Result<Vec<TaskReceipt>>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredTaskPayload {
    id: String,
    title: String,
    reward: u64,
    time_limit_seconds: u32,
    template_id: String,
    template_data: String,
    application_id: String,
    step_id: String,
    capability: String,
}

impl From<&TaskPayload> for StoredTaskPayload {
    fn from(payload: &TaskPayload) -> Self {
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
}

impl From<StoredTaskPayload> for TaskPayload {
    fn from(value: StoredTaskPayload) -> Self {
        Self {
            id: value.id,
            title: value.title,
            reward: value.reward,
            time_limit_seconds: value.time_limit_seconds,
            template_id: value.template_id,
            template_data: value.template_data,
            capability: value.capability,
            application_id: value.application_id,
            step_id: value.step_id,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredTask {
    payload: StoredTaskPayload,
    events: Vec<Event>,
    current_state: String,
    completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredCompletedTask {
    payload: StoredTaskPayload,
    events: Vec<Event>,
    result: Value,
    finished_at: u64,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationRecord {
    pub id: String,
    pub name: String,
    pub peer_id: String,
    pub created_at: u64,
    pub url: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Vec<String>,
    pub steps: Vec<ApplicationStepRecord>,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationStepRecord {
    pub template_id: String,
    pub description: Option<String>,
    pub capabilities: Vec<String>,
    pub workflow_id: String,
    pub delegation: Option<String>,
    pub r#type: String,
    pub data: String,
    pub created_at: u64,
    pub metadata: Option<HashMap<String, String>>,
}

pub struct Store {
    _db: Db,
    active: sled::Tree,
    completed: sled::Tree,
    applications: sled::Tree,
    jobs: sled::Tree,
    receipts: sled::Tree,
}

impl Store {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let db = sled::open(path)?;
        let active = db.open_tree(TREE_ACTIVE)?;
        let completed = db.open_tree(TREE_COMPLETED)?;
        let applications = db.open_tree(TREE_APPLICATIONS)?;
        let jobs = db.open_tree(TREE_JOBS)?;
        let receipts = db.open_tree(TREE_RECEIPTS)?;
        Ok(Self {
            _db: db,
            active,
            completed,
            applications,
            jobs,
            receipts,
        })
    }

    pub fn persist_active_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        current_state: &str,
        completed: bool,
    ) -> Result<()> {
        let stored = StoredTask {
            payload: payload.into(),
            events: events.to_vec(),
            current_state: current_state.to_string(),
            completed,
        };
        self.active
            .insert(task_id.as_bytes(), serde_json::to_vec(&stored)?)?;

        self.active.flush()?;
        Ok(())
    }

    pub fn load_active_tasks(&self) -> Result<Vec<LoadedTask>> {
        Ok(self
            .active
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<StoredTask>(&bytes).ok())
            .map(|stored| LoadedTask {
                payload: stored.payload.into(),
                events: stored.events,
                current_state: stored.current_state,
                completed: stored.completed,
            })
            .collect())
    }

    pub fn archive_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        result: Value,
        finished_at: u64,
    ) -> Result<()> {
        let stored = StoredCompletedTask {
            payload: payload.into(),
            events: events.to_vec(),
            result,
            finished_at,
        };

        self.completed
            .insert(task_id.as_bytes(), serde_json::to_vec(&stored)?)?;
        self.completed.flush()?;

        self.active.remove(task_id.as_bytes())?;

        self.active.flush()?;

        Ok(())
    }

    pub fn load_completed_tasks(&self) -> Result<Vec<CompletedTask>> {
        Ok(self
            .completed
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<StoredCompletedTask>(&bytes).ok())
            .map(|stored| CompletedTask {
                payload: stored.payload.into(),
                events: stored.events,
                result: stored.result,
                finished_at: stored.finished_at,
            })
            .collect())
    }

    pub fn remove_active_task(&self, task_id: &str) -> Result<()> {
        self.active.remove(task_id.as_bytes())?;
        Ok(())
    }

    pub fn put_application(&self, application: &ApplicationRecord) -> Result<()> {
        self.applications
            .insert(application.id.as_bytes(), serde_json::to_vec(application)?)?;
        self.applications.flush()?;
        Ok(())
    }

    pub fn get_application(&self, application_id: &str) -> Result<Option<ApplicationRecord>> {
        Ok(self
            .applications
            .get(application_id.as_bytes())?
            .and_then(|bytes| serde_json::from_slice(&bytes).ok()))
    }

    pub fn load_applications(&self) -> Result<Vec<ApplicationRecord>> {
        Ok(self
            .applications
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<ApplicationRecord>(&bytes).ok())
            .collect())
    }

    pub fn persist_job(&self, job: &SequenceRecord) -> Result<()> {
        self.jobs
            .insert(job.id.as_bytes(), serde_json::to_vec(job)?)?;
        self.jobs.flush()?;
        Ok(())
    }

    pub fn load_jobs(&self) -> Result<Vec<SequenceRecord>> {
        Ok(self
            .jobs
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<SequenceRecord>(&bytes).ok())
            .collect())
    }

    pub fn get_job(&self, job_id: &str) -> Result<Option<SequenceRecord>> {
        Ok(self
            .jobs
            .get(job_id.as_bytes())?
            .and_then(|bytes| serde_json::from_slice(&bytes).ok()))
    }

pub fn remove_job(&self, job_id: &str) -> Result<()> {
        self.jobs.remove(job_id.as_bytes())?;
        self.jobs.flush()?;
        Ok(())
    }

    pub fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        let encoded = encode_receipt(receipt)?;
        self.receipts
            .insert(receipt.task_id.as_bytes(), encoded)?;
        self.receipts.flush()?;
        Ok(())
    }

    pub fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        Ok(self
            .receipts
            .get(task_id.as_bytes())?
            .map(|bytes| decode_receipt(&bytes))
            .transpose()?)
    }

    pub fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        Ok(self
            .receipts
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .map(|bytes| decode_receipt(&bytes))
            .collect::<Result<Vec<_>>>()?)
    }
}

#[derive(Clone)]
pub struct ReceiptDb {
    _db: Db,
    receipts: sled::Tree,
}

impl ReceiptDb {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path_ref = path.as_ref();
        fs::create_dir_all(path_ref)?;

        let db = sled::open(path_ref)?;
        let receipts = db.open_tree(TREE_RECEIPTS)?;
        Ok(Self { _db: db, receipts })
    }

    pub fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        let encoded = encode_receipt(receipt)?;
        self.receipts
            .insert(receipt.task_id.as_bytes(), encoded)?;
        self.receipts.flush()?;
        Ok(())
    }

    pub fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        Ok(self
            .receipts
            .get(task_id.as_bytes())?
            .map(|bytes| decode_receipt(&bytes))
            .transpose()?)
    }

    pub fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        Ok(self
            .receipts
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .map(|bytes| decode_receipt(&bytes))
            .collect::<Result<Vec<_>>>()?)
    }
}

fn encode_receipt(receipt: &TaskReceipt) -> Result<Vec<u8>> {
    let mut buf = Vec::with_capacity(receipt.get_size());
    let mut writer = Writer::new(&mut buf);
    receipt
        .write_message(&mut writer)
        .context("encode task receipt")?;
    Ok(buf)
}

fn decode_receipt(bytes: &[u8]) -> Result<TaskReceipt> {
    let mut reader = BytesReader::from_bytes(bytes);
    TaskReceipt::from_reader(&mut reader, bytes).context("decode task receipt")
}

impl ReceiptStore for Store {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        Store::put_receipt(self, receipt)
    }

    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        Store::get_receipt(self, task_id)
    }

    fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        Store::list_receipts(self)
    }
}

impl ReceiptStore for ReceiptDb {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        ReceiptDb::put_receipt(self, receipt)
    }

    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        ReceiptDb::get_receipt(self, task_id)
    }

    fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        ReceiptDb::list_receipts(self)
    }
}
