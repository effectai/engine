use crate::{Application, ApplicationStep};
use proto::application as proto_app;

pub fn to_proto_application(application: &Application) -> proto_app::ApplicationResponse {
    proto_app::ApplicationResponse {
        kind: proto_app::mod_ApplicationResponse::OneOfkind::application(proto_app::Application {
            id: application.id.clone(),
            name: application.name.clone(),
            peer_id: application.peer_id.clone(),
            created_at: application.created_at,
            url: application.url.clone(),
            description: application.description.clone().unwrap_or_default(),
            icon: application.icon.clone().unwrap_or_default(),
            tags: application.tags.clone(),
            steps: application.steps.iter().map(to_proto_step).collect(),
            updated_at: application.updated_at,
        }),
    }
}

pub fn to_proto_step(step: &ApplicationStep) -> proto_app::ApplicationStep {
    proto_app::ApplicationStep {
        template_id: step.template_id.clone(),
        description: step.description.clone().unwrap_or_default(),
        capabilities: step.capabilities.clone(),
        workflow_id: step.workflow_id.clone(),
        delegation: step.delegation.as_str().to_string(),
        type_pb: step.r#type.clone(),
        data: step.data.clone(),
        created_at: step.created_at,
        metadata: step.metadata.clone(),
    }
}
