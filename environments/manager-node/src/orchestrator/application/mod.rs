use std::{collections::HashMap, sync::Arc};

use anyhow::{Result, bail};
use application::Application;
use libp2p::Swarm;
use libp2p_request_response as rr;
use proto::{
    application::{ApplicationRequest, ApplicationResponse},
    common::AckErr,
};
use storage::{ApplicationRecord, ApplicationStore, Store};
use workflow::WorkflowDefinition;

use crate::manager::EffectBehaviour;

mod messaging;

pub struct ApplicationManager {
    registered_workflows: HashMap<String, WorkflowDefinition>,
    store: Arc<Store>,
}

impl ApplicationManager {
    pub fn new(store: Arc<Store>) -> Result<Self> {
        Ok(Self {
            store,
            registered_workflows: HashMap::new(),
        })
    }

    pub fn get_application(&self, app_id: &str) -> Result<Application> {
        self.store
            .get_application(app_id)?
            .ok_or_else(|| anyhow::anyhow!("Application not found"))
            .map(|record| record.into_domain())
    }

    pub fn add_application(&mut self, app: Application) -> Result<()> {
        let app = ApplicationRecord::from_domain(&app);
        self.store.put_application(&app)?;
        Ok(())
    }

    pub fn register_workflow(&mut self, workflow: WorkflowDefinition) -> Result<()> {
        let id = workflow.id.clone();

        if self.registered_workflows.contains_key(id) {
            bail!("Workflow with id {} already registered", id);
        } else {
            self.registered_workflows.insert(id.into(), workflow);
            Ok(())
        }
    }
}

pub fn handle_application_event(
    swarm: &mut Swarm<EffectBehaviour>,
    orchestrator: &mut crate::orchestrator::application::ApplicationManager,
    event: rr::Event<ApplicationRequest, ApplicationResponse>,
) {
    match event {
        rr::Event::Message { peer, message, .. } => match message {
            rr::Message::Request {
                request, channel, ..
            } => {
                tracing::info!(%peer, ?request, "Received control request");

                let response = orchestrator.handle_request(request).unwrap_or_else(|err| {
                    tracing::error!(%peer, %err, "Error handling control request");
                    ApplicationResponse {
                        kind: proto::application::mod_ApplicationResponse::OneOfkind::err(AckErr {
                            timestamp: proto::now_ms().min(u32::MAX as u64) as u32,
                            code: 400,
                            message: err.to_string(),
                        }),
                    }
                });

                let _ = swarm
                    .behaviour_mut()
                    .application_ctrl
                    .send_response(channel, response);
            }
            rr::Message::Response {
                request_id,
                response,
            } => {
                tracing::info!(%peer, ?request_id, ?response, "Received control response");
            }
        },
        rr::Event::InboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Inbound control error");
        }
        rr::Event::OutboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Outbound control error");
        }
        rr::Event::ResponseSent { peer, .. } => {
            tracing::debug!(%peer, "Control response sent");
        }
    }
}
