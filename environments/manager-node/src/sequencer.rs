use std::collections::HashMap;
use std::sync::Arc;

use anyhow::{Result, anyhow};
use application::template;
use serde_json::{self, Value};

use crate::orchestrator::task::{NetworkAction, TaskOrchestrator};
use domain::task::TaskSubmission;
use storage::{JobStore, SequenceRecord, Store, StoredSequenceSubmission};

pub const STEP_TASK_DELIM: &str = "::step::";

#[derive(Debug, Clone)]
pub enum JobNotification {
    StepCompleted {
        task_id: String,
        application_id: String,
        step_id: String,
        result: Value,
    },
}

#[derive(Debug, Clone)]
struct SequenceState {
    id: String,
    application_id: String,
    step_order: Vec<String>,
    current_step: usize,
    submission: StoredSequenceSubmission,
    context: HashMap<String, Value>,
}

impl SequenceState {
    fn from_record(record: SequenceRecord) -> Self {
        Self {
            id: record.id,
            application_id: record.application_id,
            step_order: record.step_order,
            current_step: record.current_step,
            submission: record.submission,
            context: record.context,
        }
    }

    fn to_record(&self) -> SequenceRecord {
        SequenceRecord {
            id: self.id.clone(),
            application_id: self.application_id.clone(),
            step_order: self.step_order.clone(),
            current_step: self.current_step,
            submission: self.submission.clone(),
            context: self.context.clone(),
        }
    }
}

pub struct Sequencer {
    store: Arc<Store>,
    sequences: HashMap<String, SequenceState>,
}

impl Sequencer {
    pub fn new(store: Arc<Store>) -> Result<Self> {
        let mut jobs = HashMap::new();
        for record in store.load_jobs()? {
            let state = SequenceState::from_record(record);
            jobs.insert(state.id.clone(), state);
        }
        Ok(Self {
            store,
            sequences: jobs,
        })
    }

    pub fn submit_job(
        &mut self,
        orchestrator: &mut TaskOrchestrator,
        submission: TaskSubmission,
    ) -> Result<Vec<NetworkAction>> {
        let job_id = submission.id.clone();

        if self.sequences.contains_key(&job_id) {
            return Err(anyhow!("sequence {job_id} is already active"));
        }

        let application = orchestrator.application(&submission.application_id)?;

        if application.steps.is_empty() {
            return Err(anyhow!(
                "application {} has no steps",
                submission.application_id
            ));
        }

        let step_order: Vec<String> = application
            .steps
            .iter()
            .map(|step| step.template_id.clone())
            .collect();

        let expected_first_step = step_order
            .first()
            .ok_or_else(|| anyhow!("application {} has no steps", application.id))?;

        if submission.step_id != *expected_first_step {
            return Err(anyhow!(
                "job {} must begin at first step {}; received {}",
                job_id,
                expected_first_step,
                submission.step_id
            ));
        }

        let stored_submission = StoredSequenceSubmission {
            title: submission.title.clone(),
            reward: submission.reward,
            time_limit_seconds: submission.time_limit_seconds,
            capability: submission.capability.clone(),
        };

        let job_state = SequenceState {
            id: job_id.clone(),
            application_id: submission.application_id.clone(),
            step_order,
            current_step: 0,
            submission: stored_submission,
            context: HashMap::new(),
        };

        self.store.persist_job(&job_state.to_record())?;

        match self.start_step(&job_state, 0, orchestrator) {
            Ok(actions) => {
                self.sequences.insert(job_id, job_state);
                Ok(actions)
            }
            Err(err) => {
                let _ = self.store.remove_job(&submission.id);
                Err(err)
            }
        }
    }

    pub fn handle_notification(
        &mut self,
        notification: JobNotification,
        orchestrator: &mut TaskOrchestrator,
    ) -> Result<Vec<NetworkAction>> {
        match notification {
            JobNotification::StepCompleted {
                task_id,
                step_id,
                result,
                ..
            } => self.handle_step_completed(&task_id, &step_id, result, orchestrator),
        }
    }

    pub fn reconcile(&mut self, orchestrator: &mut TaskOrchestrator) -> Result<Vec<NetworkAction>> {
        let mut actions = Vec::new();
        for job in self.sequences.values() {
            let task_id = step_task_id(&job.id, job.current_step);
            if !orchestrator.has_task(&task_id) {
                actions.extend(self.start_step(job, job.current_step, orchestrator)?);
            }
        }
        Ok(actions)
    }

    fn handle_step_completed(
        &mut self,
        task_id: &str,
        step_id: &str,
        result: Value,
        orchestrator: &mut TaskOrchestrator,
    ) -> Result<Vec<NetworkAction>> {
        let Some((job_id, step_index)) = split_task_id(task_id) else {
            // not a managed job task
            return Ok(Vec::new());
        };

        let Some(mut job) = self.sequences.remove(job_id) else {
            // already finished or unmanaged
            return Ok(Vec::new());
        };

        if step_index != job.current_step {
            // stale completion, put the job back and ignore
            self.sequences.insert(job.id.clone(), job);
            return Ok(Vec::new());
        }

        job.context.insert(step_id.to_string(), result);

        let next_index = step_index + 1;
        if next_index >= job.step_order.len() {
            self.store.remove_job(job_id)?;
            Ok(Vec::new())
        } else {
            match self.start_step(&job, next_index, orchestrator) {
                Ok(actions) => {
                    job.current_step = next_index;
                    self.store.persist_job(&job.to_record())?;
                    let job_id = job.id.clone();
                    self.sequences.insert(job_id, job);
                    Ok(actions)
                }
                Err(err) => {
                    let job_id = job.id.clone();
                    self.sequences.insert(job_id, job);
                    Err(err)
                }
            }
        }
    }

    fn start_step(
        &self,
        job: &SequenceState,
        step_index: usize,
        orchestrator: &mut TaskOrchestrator,
    ) -> Result<Vec<NetworkAction>> {
        if step_index >= job.step_order.len() {
            return Ok(Vec::new());
        }

        let task_id = step_task_id(&job.id, step_index);
        if orchestrator.has_task(&task_id) {
            return Ok(Vec::new());
        }

        let step_id = job.step_order[step_index].clone();
        let application = orchestrator.application(&job.application_id)?;
        let step_def = application.step(&step_id).ok_or_else(|| {
            anyhow!(
                "unknown step {step_id} for application {}",
                job.application_id
            )
        })?;

        let resolved_data = template::resolve_template_str(&step_def.data, &job.context)
            .unwrap_or_else(|| step_def.data.clone());

        let job_context_value = if job.context.is_empty() {
            None
        } else {
            Some(serde_json::to_value(&job.context).unwrap_or(Value::Null))
        };

        let submission = TaskSubmission {
            id: task_id,
            title: job.submission.title.clone(),
            reward: job.submission.reward,
            time_limit_seconds: job.submission.time_limit_seconds,
            application_id: job.application_id.clone(),
            step_id,
            capability: job.submission.capability.clone(),
            template_data: Some(resolved_data),
            job_context: job_context_value,
        };

        orchestrator.create_task(submission)
    }
}

pub fn step_task_id(job_id: &str, step_index: usize) -> String {
    format!("{job_id}{STEP_TASK_DELIM}{step_index}")
}

fn split_task_id(task_id: &str) -> Option<(&str, usize)> {
    let (job, index_str) = task_id.rsplit_once(STEP_TASK_DELIM)?;
    let index = index_str.parse().ok()?;
    Some((job, index))
}
