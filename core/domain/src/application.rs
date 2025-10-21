use std::collections::HashMap;

use crate::workflow::DelegationStrategy;
use proto::application as proto_app;

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

impl Application {
    pub fn step(&self, step_id: &str) -> Option<&ApplicationStep> {
        self.steps.iter().find(|step| step.template_id == step_id)
    }

    pub fn to_proto(&self) -> proto_app::Application {
        proto_app::Application {
            id: self.id.clone(),
            name: self.name.clone(),
            peer_id: self.peer_id.clone(),
            created_at: self.created_at,
            url: self.url.clone(),
            description: self.description.clone().unwrap_or_default(),
            icon: self.icon.clone().unwrap_or_default(),
            tags: self.tags.clone(),
            steps: self.steps.iter().map(ApplicationStep::to_proto).collect(),
            updated_at: self.updated_at,
        }
    }
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

impl ApplicationStep {
    pub fn to_proto(&self) -> proto_app::ApplicationStep {
        proto_app::ApplicationStep {
            template_id: self.template_id.clone(),
            description: self.description.clone().unwrap_or_default(),
            capabilities: self.capabilities.clone(),
            workflow_id: self.workflow_id.clone(),
            delegation: self.delegation.as_str().to_string(),
            type_pb: self.r#type.clone(),
            data: self.data.clone(),
            created_at: self.created_at,
            metadata: self.metadata.clone(),
        }
    }
}

pub mod wire {
    use super::{Application, ApplicationStep};
    use proto::application as proto_app;

    pub fn to_proto_application(application: &Application) -> proto_app::ApplicationResponse {
        proto_app::ApplicationResponse {
            kind: proto_app::mod_ApplicationResponse::OneOfkind::application(
                application.to_proto(),
            ),
        }
    }

    pub fn to_proto_step(step: &ApplicationStep) -> proto_app::ApplicationStep {
        step.to_proto()
    }
}
