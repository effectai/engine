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
            effect::task::mod_TaskCtrlReq::OneOfkind::None => 0,
    }    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        match self.kind {            effect::task::mod_TaskCtrlReq::OneOfkind::task_payload(ref m) => { w.write_with_tag(10, |w| w.write_message(m))? },
            effect::task::mod_TaskCtrlReq::OneOfkind::task_message(ref m) => { w.write_with_tag(18, |w| w.write_message(m))? },
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
    None,
}

impl Default for OneOfkind {
    fn default() -> Self {
        OneOfkind::None
    }
}

}

