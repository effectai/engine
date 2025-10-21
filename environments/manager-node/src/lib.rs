mod manager;
pub mod orchestrator;
pub mod sequencer;
pub use application::{Application, ApplicationStep, DelegationStrategy};
pub use manager::{ManagerConfig, ManagerHandle, run_cli, spawn_manager};
pub use domain::task::TaskSubmission;
