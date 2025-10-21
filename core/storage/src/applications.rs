use anyhow::Result;
use domain::application::{Application, ApplicationStep};
use domain::workflow::DelegationStrategy;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

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
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

pub trait ApplicationStore {
    fn put_application(&self, application: &ApplicationRecord) -> Result<()>;
    fn get_application(&self, application_id: &str) -> Result<Option<ApplicationRecord>>;
    fn load_applications(&self) -> Result<Vec<ApplicationRecord>>;
}

impl ApplicationRecord {
    pub fn from_domain(application: &Application) -> Self {
        Self {
            id: application.id.clone(),
            name: application.name.clone(),
            peer_id: application.peer_id.clone(),
            created_at: application.created_at,
            url: application.url.clone(),
            description: application.description.clone(),
            icon: application.icon.clone(),
            tags: application.tags.clone(),
            steps: application
                .steps
                .iter()
                .map(ApplicationStepRecord::from_domain)
                .collect(),
            updated_at: application.updated_at,
        }
    }

    pub fn into_domain(self) -> Application {
        Application {
            id: self.id,
            name: self.name,
            peer_id: self.peer_id,
            created_at: self.created_at,
            url: self.url,
            description: self.description,
            icon: self.icon,
            tags: self.tags,
            steps: self
                .steps
                .into_iter()
                .map(ApplicationStepRecord::into_domain)
                .collect(),
            updated_at: self.updated_at,
        }
    }
}

impl ApplicationStepRecord {
    pub fn from_domain(step: &ApplicationStep) -> Self {
        Self {
            template_id: step.template_id.clone(),
            description: step.description.clone(),
            capabilities: step.capabilities.clone(),
            workflow_id: step.workflow_id.clone(),
            delegation: Some(step.delegation.as_str().to_string()),
            r#type: step.r#type.clone(),
            data: step.data.clone(),
            created_at: step.created_at,
            metadata: Some(step.metadata.clone()),
        }
    }

    pub fn into_domain(self) -> ApplicationStep {
        let delegation = self
            .delegation
            .as_deref()
            .and_then(|raw| DelegationStrategy::from_str(raw).ok())
            .unwrap_or_default();

        ApplicationStep {
            template_id: self.template_id,
            description: self.description,
            capabilities: self.capabilities,
            workflow_id: self.workflow_id,
            delegation,
            r#type: self.r#type,
            data: self.data,
            created_at: self.created_at,
            metadata: self.metadata.unwrap_or_default(),
        }
    }
}
