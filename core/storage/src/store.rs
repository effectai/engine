use crate::applications::{ApplicationRecord, ApplicationStore};
use crate::jobs::{JobStore, SequenceRecord};
use crate::receipts::{decode_receipt, encode_receipt, ReceiptStore};
use crate::tasks::{CompletedTask, LoadedTask, StoredCompletedTask, StoredTask, StoredTaskPayload, TaskStore};
use anyhow::{Context, Result};
use domain::task::TaskPayload;
use domain::receipt::TaskReceipt;
use serde_json::Value;
use sled::Db;
use std::fs;
use std::path::Path;
use workflow::Event;

const TREE_ACTIVE: &str = "active";
const TREE_COMPLETED: &str = "completed";
const TREE_APPLICATIONS: &str = "applications";
const TREE_JOBS: &str = "jobs";
const TREE_RECEIPTS: &str = "receipts";

#[derive(Clone)]
pub struct Store {
    db: Db,
}

impl Store {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path_ref = path.as_ref();
        fs::create_dir_all(path_ref)?;
        let db = sled::open(path_ref)?;
        Ok(Self { db })
    }

    fn tree(&self, name: &str) -> Result<sled::Tree> {
        Ok(self.db.open_tree(name)?)
    }
}

impl TaskStore for Store {
    fn persist_active_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        current_state: &str,
        completed: bool,
    ) -> Result<()> {
        let stored = StoredTask {
            payload: StoredTaskPayload::from_domain(payload),
            events: events.to_vec(),
            current_state: current_state.to_string(),
            completed,
        };

        let tree = self.tree(TREE_ACTIVE)?;
        tree.insert(
            task_id.as_bytes(),
            serde_json::to_vec(&stored).context("serialize active task")?,
        )?;
        tree.flush()?;
        Ok(())
    }

    fn load_active_tasks(&self) -> Result<Vec<LoadedTask>> {
        let tree = self.tree(TREE_ACTIVE)?;
        Ok(tree
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<StoredTask>(&bytes).ok())
            .map(|stored| LoadedTask {
                payload: stored.payload.into_domain(),
                events: stored.events,
                current_state: stored.current_state,
                completed: stored.completed,
            })
            .collect())
    }

    fn archive_task(
        &self,
        task_id: &str,
        payload: &TaskPayload,
        events: &[Event],
        result: Value,
        finished_at: u64,
    ) -> Result<()> {
        let stored = StoredCompletedTask {
            payload: StoredTaskPayload::from_domain(payload),
            events: events.to_vec(),
            result,
            finished_at,
        };

        let completed_tree = self.tree(TREE_COMPLETED)?;
        completed_tree.insert(
            task_id.as_bytes(),
            serde_json::to_vec(&stored).context("serialize completed task")?,
        )?;
        completed_tree.flush()?;

        let active_tree = self.tree(TREE_ACTIVE)?;
        active_tree.remove(task_id.as_bytes())?;
        active_tree.flush()?;
        Ok(())
    }

    fn load_completed_tasks(&self) -> Result<Vec<CompletedTask>> {
        let tree = self.tree(TREE_COMPLETED)?;
        Ok(tree
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<StoredCompletedTask>(&bytes).ok())
            .map(|stored| CompletedTask {
                payload: stored.payload.into_domain(),
                events: stored.events,
                result: stored.result,
                finished_at: stored.finished_at,
            })
            .collect())
    }

    fn remove_active_task(&self, task_id: &str) -> Result<()> {
        let tree = self.tree(TREE_ACTIVE)?;
        tree.remove(task_id.as_bytes())?;
        tree.flush()?;
        Ok(())
    }
}

impl ApplicationStore for Store {
    fn put_application(&self, application: &ApplicationRecord) -> Result<()> {
        let tree = self.tree(TREE_APPLICATIONS)?;
        tree.insert(
            application.id.as_bytes(),
            serde_json::to_vec(application).context("serialize application")?,
        )?;
        tree.flush()?;
        Ok(())
    }

    fn get_application(&self, application_id: &str) -> Result<Option<ApplicationRecord>> {
        let tree = self.tree(TREE_APPLICATIONS)?;
        Ok(tree
            .get(application_id.as_bytes())?
            .and_then(|bytes| serde_json::from_slice(&bytes).ok()))
    }

    fn load_applications(&self) -> Result<Vec<ApplicationRecord>> {
        let tree = self.tree(TREE_APPLICATIONS)?;
        Ok(tree
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<ApplicationRecord>(&bytes).ok())
            .collect())
    }
}

impl JobStore for Store {
    fn persist_job(&self, job: &SequenceRecord) -> Result<()> {
        let tree = self.tree(TREE_JOBS)?;
        tree.insert(
            job.id.as_bytes(),
            serde_json::to_vec(job).context("serialize job")?,
        )?;
        tree.flush()?;
        Ok(())
    }

    fn load_jobs(&self) -> Result<Vec<SequenceRecord>> {
        let tree = self.tree(TREE_JOBS)?;
        Ok(tree
            .iter()
            .values()
            .filter_map(|res| res.ok())
            .filter_map(|bytes| serde_json::from_slice::<SequenceRecord>(&bytes).ok())
            .collect())
    }

    fn get_job(&self, job_id: &str) -> Result<Option<SequenceRecord>> {
        let tree = self.tree(TREE_JOBS)?;
        Ok(tree
            .get(job_id.as_bytes())?
            .and_then(|bytes| serde_json::from_slice(&bytes).ok()))
    }

    fn remove_job(&self, job_id: &str) -> Result<()> {
        let tree = self.tree(TREE_JOBS)?;
        tree.remove(job_id.as_bytes())?;
        tree.flush()?;
        Ok(())
    }
}

impl ReceiptStore for Store {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        let tree = self.tree(TREE_RECEIPTS)?;
        let encoded = encode_receipt(receipt)?;
        tree.insert(receipt.task_id.as_bytes(), encoded)?;
        tree.flush()?;
        Ok(())
    }

    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        let tree = self.tree(TREE_RECEIPTS)?;
        Ok(tree
            .get(task_id.as_bytes())?
            .map(|bytes| decode_receipt(&bytes))
            .transpose()?)
    }

    fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        let tree = self.tree(TREE_RECEIPTS)?;
        tree.iter()
            .values()
            .filter_map(|res| res.ok())
            .map(|bytes| decode_receipt(&bytes))
            .collect()
    }
}
