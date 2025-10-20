use std::collections::HashMap;
use std::str::FromStr;

use storage::{ApplicationRecord, ApplicationStepRecord};

pub mod builder;
pub mod template;
pub mod wire;

pub use builder::{ApplicationBuilder, StepContext};
pub use template::{reference_field, reference_step, resolve_template_str};
pub use workflow::DelegationStrategy;

#[derive(Debug, Clone)]
pub struct Application {
    pub id: String,
    pub name: String,
    pub peer_id: String,
    pub created_at: u64,
    pub url: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub tags: Vec<String>,
    pub steps: Vec<ApplicationStep>,
    pub updated_at: u64,
}

#[derive(Debug, Clone)]
pub struct ApplicationStep {
    pub template_id: String,
    pub description: Option<String>,
    pub capabilities: Vec<String>,
    pub workflow_id: String,
    pub delegation: DelegationStrategy,
    pub r#type: String,
    pub data: String,
    pub created_at: u64,
    pub metadata: HashMap<String, String>,
}

impl Application {
    pub fn step(&self, step_id: &str) -> Option<&ApplicationStep> {
        self.steps.iter().find(|step| step.template_id == step_id)
    }
}

impl From<ApplicationRecord> for Application {
    fn from(value: ApplicationRecord) -> Self {
        Self {
            id: value.id,
            name: value.name,
            peer_id: value.peer_id,
            created_at: value.created_at,
            url: value.url,
            description: value.description,
            icon: value.icon,
            tags: value.tags,
            steps: value.steps.into_iter().map(ApplicationStep::from).collect(),
            updated_at: value.updated_at,
        }
    }
}

impl From<Application> for ApplicationRecord {
    fn from(value: Application) -> Self {
        ApplicationRecord {
            id: value.id,
            name: value.name,
            peer_id: value.peer_id,
            created_at: value.created_at,
            url: value.url,
            description: value.description,
            icon: value.icon,
            tags: value.tags,
            steps: value
                .steps
                .into_iter()
                .map(ApplicationStepRecord::from)
                .collect(),
            updated_at: value.updated_at,
        }
    }
}

impl From<ApplicationStepRecord> for ApplicationStep {
    fn from(value: ApplicationStepRecord) -> Self {
        let delegation = value
            .delegation
            .as_deref()
            .and_then(|raw| DelegationStrategy::from_str(raw).ok())
            .unwrap_or_default();

        Self {
            template_id: value.template_id,
            description: value.description,
            capabilities: value.capabilities,
            workflow_id: value.workflow_id,
            delegation,
            r#type: value.r#type,
            data: value.data,
            created_at: value.created_at,
            metadata: value.metadata.unwrap_or_default(),
        }
    }
}

impl From<ApplicationStep> for ApplicationStepRecord {
    fn from(value: ApplicationStep) -> Self {
        ApplicationStepRecord {
            template_id: value.template_id,
            description: value.description,
            capabilities: value.capabilities,
            workflow_id: value.workflow_id,
            delegation: Some(value.delegation.as_str().to_string()),
            r#type: value.r#type,
            data: value.data,
            created_at: value.created_at,
            metadata: Some(value.metadata),
        }
    }
}
