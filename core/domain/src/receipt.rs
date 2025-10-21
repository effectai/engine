#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ManagerSignature {
    pub r_x: Vec<u8>,
    pub r_y: Vec<u8>,
    pub s: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ManagerPublicKey {
    pub x: Vec<u8>,
    pub y: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TaskReceipt {
    pub task_id: String,
    pub reward: u64,
    pub duration: u64,
    pub signature: ManagerSignature,
    pub manager: ManagerPublicKey,
    pub nullifier: Vec<u8>,
}

impl TaskReceipt {
    pub fn from_proto(proto: &proto::task::TaskReceipt) -> Self {
        Self {
            task_id: proto.task_id.clone(),
            reward: proto.reward,
            duration: proto.duration,
            signature: ManagerSignature {
                r_x: proto
                    .signature
                    .as_ref()
                    .map(|s| s.r_x.clone())
                    .unwrap_or_default(),
                r_y: proto
                    .signature
                    .as_ref()
                    .map(|s| s.r_y.clone())
                    .unwrap_or_default(),
                s: proto
                    .signature
                    .as_ref()
                    .map(|s| s.s.clone())
                    .unwrap_or_default(),
            },
            manager: ManagerPublicKey {
                x: proto
                    .manager
                    .as_ref()
                    .map(|m| m.x.clone())
                    .unwrap_or_default(),
                y: proto
                    .manager
                    .as_ref()
                    .map(|m| m.y.clone())
                    .unwrap_or_default(),
            },
            nullifier: proto.nullifier.clone(),
        }
    }

    pub fn into_proto(self) -> proto::task::TaskReceipt {
        proto::task::TaskReceipt {
            task_id: self.task_id,
            reward: self.reward,
            duration: self.duration,
            signature: Some(proto::task::ManagerSignature {
                r_x: self.signature.r_x,
                r_y: self.signature.r_y,
                s: self.signature.s,
            }),
            manager: Some(proto::task::ManagerPublicKey {
                x: self.manager.x,
                y: self.manager.y,
            }),
            nullifier: self.nullifier,
        }
    }
}
