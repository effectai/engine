use domain::receipt::TaskReceipt;
use domain::task::{TaskMessage, TaskPayload};
use proto::task::{self as proto_task, TaskCtrlReq};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TaskDecodeError {
    #[error("empty task request")]
    Empty,
}

#[derive(Debug, Clone)]
pub enum TaskInbound {
    Payload(TaskPayload),
    Message(TaskMessage),
    Receipt(TaskReceipt),
}

#[derive(Debug, Clone)]
pub enum TaskOutbound {
    Payload(TaskPayload),
    Message(TaskMessage),
    Receipt(TaskReceipt),
}

impl TryFrom<TaskCtrlReq> for TaskInbound {
    type Error = TaskDecodeError;

    fn try_from(value: TaskCtrlReq) -> Result<Self, Self::Error> {
        match value.kind {
            proto_task::mod_TaskCtrlReq::OneOfkind::task_payload(payload) => {
                Ok(TaskInbound::Payload(TaskPayload::from_proto(&payload)))
            }
            proto_task::mod_TaskCtrlReq::OneOfkind::task_message(message) => {
                Ok(TaskInbound::Message(TaskMessage::from_proto(message)))
            }
            proto_task::mod_TaskCtrlReq::OneOfkind::task_receipt(receipt) => {
                Ok(TaskInbound::Receipt(TaskReceipt::from_proto(&receipt)))
            }
            proto_task::mod_TaskCtrlReq::OneOfkind::None => Err(TaskDecodeError::Empty),
        }
    }
}

impl From<TaskOutbound> for TaskCtrlReq {
    fn from(value: TaskOutbound) -> Self {
        let kind = match value {
            TaskOutbound::Payload(payload) => {
                proto_task::mod_TaskCtrlReq::OneOfkind::task_payload(payload.into_proto())
            }
            TaskOutbound::Message(message) => {
                proto_task::mod_TaskCtrlReq::OneOfkind::task_message(message.into_proto())
            }
            TaskOutbound::Receipt(receipt) => {
                proto_task::mod_TaskCtrlReq::OneOfkind::task_receipt(receipt.into_proto())
            }
        };

        TaskCtrlReq { kind }
    }
}
