use anyhow::{Context, Result};
use domain::receipt::TaskReceipt;
use proto::task as proto_task;
use quick_protobuf::{BytesReader, MessageRead, MessageWrite, Writer};
use sled::Db;
use std::fs;
use std::path::Path;

const TREE_RECEIPTS: &str = "receipts";

pub trait ReceiptStore {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()>;
    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>>;
    fn list_receipts(&self) -> Result<Vec<TaskReceipt>>;
}

#[derive(Clone)]
pub struct ReceiptDb {
    db: Db,
}

impl ReceiptDb {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path_ref = path.as_ref();
        fs::create_dir_all(path_ref)?;
        let db = sled::open(path_ref)?;
        Ok(Self { db })
    }

    fn tree(&self) -> Result<sled::Tree> {
        Ok(self.db.open_tree(TREE_RECEIPTS)?)
    }

    fn encode(receipt: &TaskReceipt) -> Result<Vec<u8>> {
        let proto = receipt.clone().into_proto();
        let mut buf = Vec::with_capacity(proto.get_size());
        let mut writer = Writer::new(&mut buf);
        proto
            .write_message(&mut writer)
            .context("encode task receipt")?;
        Ok(buf)
    }

    fn decode(bytes: &[u8]) -> Result<TaskReceipt> {
        let mut reader = BytesReader::from_bytes(bytes);
        let proto = proto_task::TaskReceipt::from_reader(&mut reader, bytes)
            .context("decode task receipt")?;
        Ok(TaskReceipt::from_proto(&proto))
    }
}

impl ReceiptStore for ReceiptDb {
    fn put_receipt(&self, receipt: &TaskReceipt) -> Result<()> {
        let tree = self.tree()?;
        let encoded = Self::encode(receipt)?;
        tree.insert(receipt.task_id.as_bytes(), encoded)?;
        tree.flush()?;
        Ok(())
    }

    fn get_receipt(&self, task_id: &str) -> Result<Option<TaskReceipt>> {
        let tree = self.tree()?;
        Ok(tree
            .get(task_id.as_bytes())?
            .map(|bytes| Self::decode(&bytes))
            .transpose()?)
    }

    fn list_receipts(&self) -> Result<Vec<TaskReceipt>> {
        let tree = self.tree()?;
        tree.iter()
            .values()
            .filter_map(|res| res.ok())
            .map(|bytes| Self::decode(&bytes))
            .collect()
    }
}

pub(crate) fn encode_receipt(receipt: &TaskReceipt) -> Result<Vec<u8>> {
    ReceiptDb::encode(receipt)
}

pub(crate) fn decode_receipt(bytes: &[u8]) -> Result<TaskReceipt> {
    ReceiptDb::decode(bytes)
}
