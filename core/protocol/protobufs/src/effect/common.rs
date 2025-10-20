// Automatically generated rust module for 'common.proto' file

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
pub struct AckOk {
    pub timestamp: u32,
}

impl<'a> MessageRead<'a> for AckOk {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(8) => msg.timestamp = r.read_uint32(bytes)?,
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for AckOk {
    fn get_size(&self) -> usize {
        0
        + if self.timestamp == 0u32 { 0 } else { 1 + sizeof_varint(*(&self.timestamp) as u64) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.timestamp != 0u32 { w.write_with_tag(8, |w| w.write_uint32(*&self.timestamp))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct AckErr {
    pub timestamp: u32,
    pub code: u32,
    pub message: String,
}

impl<'a> MessageRead<'a> for AckErr {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(8) => msg.timestamp = r.read_uint32(bytes)?,
                Ok(16) => msg.code = r.read_uint32(bytes)?,
                Ok(26) => msg.message = r.read_string(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for AckErr {
    fn get_size(&self) -> usize {
        0
        + if self.timestamp == 0u32 { 0 } else { 1 + sizeof_varint(*(&self.timestamp) as u64) }
        + if self.code == 0u32 { 0 } else { 1 + sizeof_varint(*(&self.code) as u64) }
        + if self.message == String::default() { 0 } else { 1 + sizeof_len((&self.message).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.timestamp != 0u32 { w.write_with_tag(8, |w| w.write_uint32(*&self.timestamp))?; }
        if self.code != 0u32 { w.write_with_tag(16, |w| w.write_uint32(*&self.code))?; }
        if self.message != String::default() { w.write_with_tag(26, |w| w.write_string(&**&self.message))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct CtrlAck {
    pub kind: effect::common::mod_CtrlAck::OneOfkind,
}

impl<'a> MessageRead<'a> for CtrlAck {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.kind = effect::common::mod_CtrlAck::OneOfkind::ok(r.read_message::<effect::common::AckOk>(bytes)?),
                Ok(18) => msg.kind = effect::common::mod_CtrlAck::OneOfkind::err(r.read_message::<effect::common::AckErr>(bytes)?),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for CtrlAck {
    fn get_size(&self) -> usize {
        0
        + match self.kind {
            effect::common::mod_CtrlAck::OneOfkind::ok(ref m) => 1 + sizeof_len((m).get_size()),
            effect::common::mod_CtrlAck::OneOfkind::err(ref m) => 1 + sizeof_len((m).get_size()),
            effect::common::mod_CtrlAck::OneOfkind::None => 0,
    }    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        match self.kind {            effect::common::mod_CtrlAck::OneOfkind::ok(ref m) => { w.write_with_tag(10, |w| w.write_message(m))? },
            effect::common::mod_CtrlAck::OneOfkind::err(ref m) => { w.write_with_tag(18, |w| w.write_message(m))? },
            effect::common::mod_CtrlAck::OneOfkind::None => {},
    }        Ok(())
    }
}

pub mod mod_CtrlAck {

use super::*;

#[derive(Debug, PartialEq, Clone)]
pub enum OneOfkind {
    ok(effect::common::AckOk),
    err(effect::common::AckErr),
    None,
}

impl Default for OneOfkind {
    fn default() -> Self {
        OneOfkind::None
    }
}

}

