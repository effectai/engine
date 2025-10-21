use domain::application::Application;
use proto::application as proto_app;
use proto::common::AckErr;

#[derive(Debug, Clone)]
pub enum ApplicationRequest {
    Get { id: String },
}

#[derive(Debug, Clone)]
pub enum ApplicationResponse {
    Application(Application),
    Err(AckErr),
}

impl From<ApplicationRequest> for proto_app::ApplicationRequest {
    fn from(value: ApplicationRequest) -> Self {
        match value {
            ApplicationRequest::Get { id } => proto_app::ApplicationRequest { id },
        }
    }
}

impl From<proto_app::ApplicationRequest> for ApplicationRequest {
    fn from(value: proto_app::ApplicationRequest) -> Self {
        ApplicationRequest::Get { id: value.id }
    }
}

impl From<ApplicationResponse> for proto_app::ApplicationResponse {
    fn from(value: ApplicationResponse) -> Self {
        match value {
            ApplicationResponse::Application(app) => proto_app::ApplicationResponse {
                kind: proto_app::mod_ApplicationResponse::OneOfkind::application(app.to_proto()),
            },
            ApplicationResponse::Err(err) => proto_app::ApplicationResponse {
                kind: proto_app::mod_ApplicationResponse::OneOfkind::err(err),
            },
        }
    }
}

impl From<proto_app::ApplicationResponse> for ApplicationResponse {
    fn from(value: proto_app::ApplicationResponse) -> Self {
        match value.kind {
            proto_app::mod_ApplicationResponse::OneOfkind::application(app) => {
                ApplicationResponse::Application(Application::from_proto(app))
            }
            proto_app::mod_ApplicationResponse::OneOfkind::err(err) => {
                ApplicationResponse::Err(err)
            }
            proto_app::mod_ApplicationResponse::OneOfkind::None => {
                ApplicationResponse::Err(AckErr {
                    timestamp: 0,
                    code: 500,
                    message: "empty application response".into(),
                })
            }
        }
    }
}
