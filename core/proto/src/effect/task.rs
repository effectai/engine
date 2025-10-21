// Automatically generated rust module for 'task.proto' file

#![allow(non_snake_case)]
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(unused_imports)]
#![allow(unknown_lints)]
#![allow(clippy::all)]
#![cfg_attr(rustfmt, rustfmt_skip)]


use quick_protobuf::{MessageInfo, MessageRead, MessageWrite, BytesReader, Writer, WriterBackend, Result};
use quick_protobuf::sizeofs::*;
use super::super::*;

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct TaskPayload {
    pub id: String,
    pub title: String,
    pub reward: u64,
    pub time_limit_seconds: u32,
    pub template_id: String,
    pub template_data: String,
    pub application_id: String,
    pub step_id: String,
    pub capability: String,
}

impl<'a> MessageRead<'a> for TaskPayload {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.id = r.read_string(bytes)?.to_owned(),
                Ok(18) => msg.title = r.read_string(bytes)?.to_owned(),
                Ok(24) => msg.reward = r.read_uint64(bytes)?,
                Ok(32) => msg.time_limit_seconds = r.read_uint32(bytes)?,
                Ok(42) => msg.template_id = r.read_string(bytes)?.to_owned(),
                Ok(50) => msg.template_data = r.read_string(bytes)?.to_owned(),
                Ok(58) => msg.application_id = r.read_string(bytes)?.to_owned(),
                Ok(66) => msg.step_id = r.read_string(bytes)?.to_owned(),
                Ok(74) => msg.capability = r.read_string(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for TaskPayload {
    fn get_size(&self) -> usize {
        0
        + if self.id == String::default() { 0 } else { 1 + sizeof_len((&self.id).len()) }
        + if self.title == String::default() { 0 } else { 1 + sizeof_len((&self.title).len()) }
        + if self.reward == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.reward) as u64) }
        + if self.time_limit_seconds == 0u32 { 0 } else { 1 + sizeof_varint(*(&self.time_limit_seconds) as u64) }
        + if self.template_id == String::default() { 0 } else { 1 + sizeof_len((&self.template_id).len()) }
        + if self.template_data == String::default() { 0 } else { 1 + sizeof_len((&self.template_data).len()) }
        + if self.application_id == String::default() { 0 } else { 1 + sizeof_len((&self.application_id).len()) }
        + if self.step_id == String::default() { 0 } else { 1 + sizeof_len((&self.step_id).len()) }
        + if self.capability == String::default() { 0 } else { 1 + sizeof_len((&self.capability).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.id))?; }
        if self.title != String::default() { w.write_with_tag(18, |w| w.write_string(&**&self.title))?; }
        if self.reward != 0u64 { w.write_with_tag(24, |w| w.write_uint64(*&self.reward))?; }
        if self.time_limit_seconds != 0u32 { w.write_with_tag(32, |w| w.write_uint32(*&self.time_limit_seconds))?; }
        if self.template_id != String::default() { w.write_with_tag(42, |w| w.write_string(&**&self.template_id))?; }
        if self.template_data != String::default() { w.write_with_tag(50, |w| w.write_string(&**&self.template_data))?; }
        if self.application_id != String::default() { w.write_with_tag(58, |w| w.write_string(&**&self.application_id))?; }
        if self.step_id != String::default() { w.write_with_tag(66, |w| w.write_string(&**&self.step_id))?; }
        if self.capability != String::default() { w.write_with_tag(74, |w| w.write_string(&**&self.capability))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct TaskMessage {
    pub task_id: String,
    pub type_pb: String,
    pub data: Vec<u8>,
    pub timestamp: i32,
}

impl<'a> MessageRead<'a> for TaskMessage {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.task_id = r.read_string(bytes)?.to_owned(),
                Ok(18) => msg.type_pb = r.read_string(bytes)?.to_owned(),
                Ok(26) => msg.data = r.read_bytes(bytes)?.to_owned(),
                Ok(32) => msg.timestamp = r.read_int32(bytes)?,
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for TaskMessage {
    fn get_size(&self) -> usize {
        0
        + if self.task_id == String::default() { 0 } else { 1 + sizeof_len((&self.task_id).len()) }
        + if self.type_pb == String::default() { 0 } else { 1 + sizeof_len((&self.type_pb).len()) }
        + if self.data.is_empty() { 0 } else { 1 + sizeof_len((&self.data).len()) }
        + if self.timestamp == 0i32 { 0 } else { 1 + sizeof_varint(*(&self.timestamp) as u64) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.task_id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.task_id))?; }
        if self.type_pb != String::default() { w.write_with_tag(18, |w| w.write_string(&**&self.type_pb))?; }
        if !self.data.is_empty() { w.write_with_tag(26, |w| w.write_bytes(&**&self.data))?; }
        if self.timestamp != 0i32 { w.write_with_tag(32, |w| w.write_int32(*&self.timestamp))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct ManagerPublicKey {
    pub x: Vec<u8>,
    pub y: Vec<u8>,
}

impl<'a> MessageRead<'a> for ManagerPublicKey {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.x = r.read_bytes(bytes)?.to_owned(),
                Ok(18) => msg.y = r.read_bytes(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for ManagerPublicKey {
    fn get_size(&self) -> usize {
        0
        + if self.x.is_empty() { 0 } else { 1 + sizeof_len((&self.x).len()) }
        + if self.y.is_empty() { 0 } else { 1 + sizeof_len((&self.y).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if !self.x.is_empty() { w.write_with_tag(10, |w| w.write_bytes(&**&self.x))?; }
        if !self.y.is_empty() { w.write_with_tag(18, |w| w.write_bytes(&**&self.y))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct ManagerSignature {
    pub r_x: Vec<u8>,
    pub r_y: Vec<u8>,
    pub s: Vec<u8>,
}

impl<'a> MessageRead<'a> for ManagerSignature {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.r_x = r.read_bytes(bytes)?.to_owned(),
                Ok(18) => msg.r_y = r.read_bytes(bytes)?.to_owned(),
                Ok(26) => msg.s = r.read_bytes(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for ManagerSignature {
    fn get_size(&self) -> usize {
        0
        + if self.r_x.is_empty() { 0 } else { 1 + sizeof_len((&self.r_x).len()) }
        + if self.r_y.is_empty() { 0 } else { 1 + sizeof_len((&self.r_y).len()) }
        + if self.s.is_empty() { 0 } else { 1 + sizeof_len((&self.s).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if !self.r_x.is_empty() { w.write_with_tag(10, |w| w.write_bytes(&**&self.r_x))?; }
        if !self.r_y.is_empty() { w.write_with_tag(18, |w| w.write_bytes(&**&self.r_y))?; }
        if !self.s.is_empty() { w.write_with_tag(26, |w| w.write_bytes(&**&self.s))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct TaskReceipt {
    pub task_id: String,
    pub reward: u64,
    pub duration: u64,
    pub signature: Option<effect::task::ManagerSignature>,
    pub manager: Option<effect::task::ManagerPublicKey>,
    pub nullifier: Vec<u8>,
}

impl<'a> MessageRead<'a> for TaskReceipt {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.task_id = r.read_string(bytes)?.to_owned(),
                Ok(16) => msg.reward = r.read_uint64(bytes)?,
                Ok(24) => msg.duration = r.read_uint64(bytes)?,
                Ok(34) => msg.signature = Some(r.read_message::<effect::task::ManagerSignature>(bytes)?),
                Ok(42) => msg.manager = Some(r.read_message::<effect::task::ManagerPublicKey>(bytes)?),
                Ok(50) => msg.nullifier = r.read_bytes(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for TaskReceipt {
    fn get_size(&self) -> usize {
        0
        + if self.task_id == String::default() { 0 } else { 1 + sizeof_len((&self.task_id).len()) }
        + if self.reward == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.reward) as u64) }
        + if self.duration == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.duration) as u64) }
        + self.signature.as_ref().map_or(0, |m| 1 + sizeof_len((m).get_size()))
        + self.manager.as_ref().map_or(0, |m| 1 + sizeof_len((m).get_size()))
        + if self.nullifier.is_empty() { 0 } else { 1 + sizeof_len((&self.nullifier).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.task_id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.task_id))?; }
        if self.reward != 0u64 { w.write_with_tag(16, |w| w.write_uint64(*&self.reward))?; }
        if self.duration != 0u64 { w.write_with_tag(24, |w| w.write_uint64(*&self.duration))?; }
        if let Some(ref s) = self.signature { w.write_with_tag(34, |w| w.write_message(s))?; }
        if let Some(ref s) = self.manager { w.write_with_tag(42, |w| w.write_message(s))?; }
        if !self.nullifier.is_empty() { w.write_with_tag(50, |w| w.write_bytes(&**&self.nullifier))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct TaskCtrlReq {
    pub kind: effect::task::mod_TaskCtrlReq::OneOfkind,
}

impl<'a> MessageRead<'a> for TaskCtrlReq {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.kind = effect::task::mod_TaskCtrlReq::OneOfkind::task_payload(r.read_message::<effect::task::TaskPayload>(bytes)?),
                Ok(18) => msg.kind = effect::task::mod_TaskCtrlReq::OneOfkind::task_message(r.read_message::<effect::task::TaskMessage>(bytes)?),
                Ok(26) => msg.kind = effect::task::mod_TaskCtrlReq::OneOfkind::task_receipt(r.read_message::<effect::task::TaskReceipt>(bytes)?),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for TaskCtrlReq {
    fn get_size(&self) -> usize {
        0
        + match self.kind {
            effect::task::mod_TaskCtrlReq::OneOfkind::task_payload(ref m) => 1 + sizeof_len((m).get_size()),
            effect::task::mod_TaskCtrlReq::OneOfkind::task_message(ref m) => 1 + sizeof_len((m).get_size()),
            effect::task::mod_TaskCtrlReq::OneOfkind::task_receipt(ref m) => 1 + sizeof_len((m).get_size()),
            effect::task::mod_TaskCtrlReq::OneOfkind::None => 0,
    }    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        match self.kind {            effect::task::mod_TaskCtrlReq::OneOfkind::task_payload(ref m) => { w.write_with_tag(10, |w| w.write_message(m))? },
            effect::task::mod_TaskCtrlReq::OneOfkind::task_message(ref m) => { w.write_with_tag(18, |w| w.write_message(m))? },
            effect::task::mod_TaskCtrlReq::OneOfkind::task_receipt(ref m) => { w.write_with_tag(26, |w| w.write_message(m))? },
            effect::task::mod_TaskCtrlReq::OneOfkind::None => {},
    }        Ok(())
    }
}

pub mod mod_TaskCtrlReq {

use super::*;

#[derive(Debug, PartialEq, Clone)]
pub enum OneOfkind {
    task_payload(effect::task::TaskPayload),
    task_message(effect::task::TaskMessage),
    task_receipt(effect::task::TaskReceipt),
    None,
}

impl Default for OneOfkind {
    fn default() -> Self {
        OneOfkind::None
    }
}

}

