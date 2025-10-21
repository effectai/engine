use net::application::{
    ApplicationRequest as NetApplicationRequest, ApplicationResponse as NetApplicationResponse,
};
use proto::application::{ApplicationRequest, ApplicationResponse};
use proto::common::AckErr;
use proto::now_ms;

use super::*;

impl ApplicationManager {
    pub fn handle_request(
        &self,
        request: ApplicationRequest,
    ) -> Result<ApplicationResponse, anyhow::Error> {
        match NetApplicationRequest::from(request) {
            NetApplicationRequest::Get { id } => {
                if let Ok(app) = self.get_application(&id) {
                    Ok(NetApplicationResponse::Application(app).into())
                } else {
                    let err = AckErr {
                        timestamp: now_ms().min(u32::MAX as u64) as u32,
                        code: 404,
                        message: "Application not found".into(),
                    };
                    Ok(NetApplicationResponse::Err(err).into())
                }
            }
        }
    }
}
