use application::wire::to_proto_application;
use proto::application::{ApplicationRequest, ApplicationResponse};

use super::*;

impl ApplicationManager {
    pub fn handle_request(
        &self,
        request: ApplicationRequest,
    ) -> Result<ApplicationResponse, anyhow::Error> {
        match request {
            proto::application::ApplicationRequest { id } => {
                if let Some(app) = self.get_application(&id).ok() {
                    Ok(to_proto_application(&app))
                } else {
                    Err(anyhow::anyhow!("Application not found"))
                }
            }
        }
    }
}
