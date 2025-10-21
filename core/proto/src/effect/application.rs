// Automatically generated rust module for 'application.proto' file

#![allow(non_snake_case)]
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(unused_imports)]
#![allow(unknown_lints)]
#![allow(clippy::all)]
#![cfg_attr(rustfmt, rustfmt_skip)]


use std::collections::HashMap;
type KVMap<K, V> = HashMap<K, V>;
use quick_protobuf::{MessageInfo, MessageRead, MessageWrite, BytesReader, Writer, WriterBackend, Result};
use quick_protobuf::sizeofs::*;
use super::super::*;

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct ApplicationRequest {
    pub id: String,
}

impl<'a> MessageRead<'a> for ApplicationRequest {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.id = r.read_string(bytes)?.to_owned(),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for ApplicationRequest {
    fn get_size(&self) -> usize {
        0
        + if self.id == String::default() { 0 } else { 1 + sizeof_len((&self.id).len()) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.id))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct Application {
    pub id: String,
    pub name: String,
    pub peer_id: String,
    pub created_at: u64,
    pub url: String,
    pub description: String,
    pub icon: String,
    pub tags: Vec<String>,
    pub steps: Vec<effect::application::ApplicationStep>,
    pub updated_at: u64,
}

impl<'a> MessageRead<'a> for Application {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.id = r.read_string(bytes)?.to_owned(),
                Ok(18) => msg.name = r.read_string(bytes)?.to_owned(),
                Ok(26) => msg.peer_id = r.read_string(bytes)?.to_owned(),
                Ok(32) => msg.created_at = r.read_uint64(bytes)?,
                Ok(42) => msg.url = r.read_string(bytes)?.to_owned(),
                Ok(50) => msg.description = r.read_string(bytes)?.to_owned(),
                Ok(58) => msg.icon = r.read_string(bytes)?.to_owned(),
                Ok(66) => msg.tags.push(r.read_string(bytes)?.to_owned()),
                Ok(74) => msg.steps.push(r.read_message::<effect::application::ApplicationStep>(bytes)?),
                Ok(80) => msg.updated_at = r.read_uint64(bytes)?,
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for Application {
    fn get_size(&self) -> usize {
        0
        + if self.id == String::default() { 0 } else { 1 + sizeof_len((&self.id).len()) }
        + if self.name == String::default() { 0 } else { 1 + sizeof_len((&self.name).len()) }
        + if self.peer_id == String::default() { 0 } else { 1 + sizeof_len((&self.peer_id).len()) }
        + if self.created_at == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.created_at) as u64) }
        + if self.url == String::default() { 0 } else { 1 + sizeof_len((&self.url).len()) }
        + if self.description == String::default() { 0 } else { 1 + sizeof_len((&self.description).len()) }
        + if self.icon == String::default() { 0 } else { 1 + sizeof_len((&self.icon).len()) }
        + self.tags.iter().map(|s| 1 + sizeof_len((s).len())).sum::<usize>()
        + self.steps.iter().map(|s| 1 + sizeof_len((s).get_size())).sum::<usize>()
        + if self.updated_at == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.updated_at) as u64) }
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.id))?; }
        if self.name != String::default() { w.write_with_tag(18, |w| w.write_string(&**&self.name))?; }
        if self.peer_id != String::default() { w.write_with_tag(26, |w| w.write_string(&**&self.peer_id))?; }
        if self.created_at != 0u64 { w.write_with_tag(32, |w| w.write_uint64(*&self.created_at))?; }
        if self.url != String::default() { w.write_with_tag(42, |w| w.write_string(&**&self.url))?; }
        if self.description != String::default() { w.write_with_tag(50, |w| w.write_string(&**&self.description))?; }
        if self.icon != String::default() { w.write_with_tag(58, |w| w.write_string(&**&self.icon))?; }
        for s in &self.tags { w.write_with_tag(66, |w| w.write_string(&**s))?; }
        for s in &self.steps { w.write_with_tag(74, |w| w.write_message(s))?; }
        if self.updated_at != 0u64 { w.write_with_tag(80, |w| w.write_uint64(*&self.updated_at))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct ApplicationStep {
    pub template_id: String,
    pub description: String,
    pub capabilities: Vec<String>,
    pub workflow_id: String,
    pub delegation: String,
    pub type_pb: String,
    pub data: String,
    pub created_at: u64,
    pub metadata: KVMap<String, String>,
}

impl<'a> MessageRead<'a> for ApplicationStep {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.template_id = r.read_string(bytes)?.to_owned(),
                Ok(18) => msg.description = r.read_string(bytes)?.to_owned(),
                Ok(26) => msg.capabilities.push(r.read_string(bytes)?.to_owned()),
                Ok(34) => msg.workflow_id = r.read_string(bytes)?.to_owned(),
                Ok(42) => msg.delegation = r.read_string(bytes)?.to_owned(),
                Ok(50) => msg.type_pb = r.read_string(bytes)?.to_owned(),
                Ok(58) => msg.data = r.read_string(bytes)?.to_owned(),
                Ok(64) => msg.created_at = r.read_uint64(bytes)?,
                Ok(74) => {
                    let (key, value) = r.read_map(bytes, |r, bytes| Ok(r.read_string(bytes)?.to_owned()), |r, bytes| Ok(r.read_string(bytes)?.to_owned()))?;
                    msg.metadata.insert(key, value);
                }
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for ApplicationStep {
    fn get_size(&self) -> usize {
        0
        + if self.template_id == String::default() { 0 } else { 1 + sizeof_len((&self.template_id).len()) }
        + if self.description == String::default() { 0 } else { 1 + sizeof_len((&self.description).len()) }
        + self.capabilities.iter().map(|s| 1 + sizeof_len((s).len())).sum::<usize>()
        + if self.workflow_id == String::default() { 0 } else { 1 + sizeof_len((&self.workflow_id).len()) }
        + if self.delegation == String::default() { 0 } else { 1 + sizeof_len((&self.delegation).len()) }
        + if self.type_pb == String::default() { 0 } else { 1 + sizeof_len((&self.type_pb).len()) }
        + if self.data == String::default() { 0 } else { 1 + sizeof_len((&self.data).len()) }
        + if self.created_at == 0u64 { 0 } else { 1 + sizeof_varint(*(&self.created_at) as u64) }
        + self.metadata.iter().map(|(k, v)| 1 + sizeof_len(2 + sizeof_len((k).len()) + sizeof_len((v).len()))).sum::<usize>()
    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        if self.template_id != String::default() { w.write_with_tag(10, |w| w.write_string(&**&self.template_id))?; }
        if self.description != String::default() { w.write_with_tag(18, |w| w.write_string(&**&self.description))?; }
        for s in &self.capabilities { w.write_with_tag(26, |w| w.write_string(&**s))?; }
        if self.workflow_id != String::default() { w.write_with_tag(34, |w| w.write_string(&**&self.workflow_id))?; }
        if self.delegation != String::default() { w.write_with_tag(42, |w| w.write_string(&**&self.delegation))?; }
        if self.type_pb != String::default() { w.write_with_tag(50, |w| w.write_string(&**&self.type_pb))?; }
        if self.data != String::default() { w.write_with_tag(58, |w| w.write_string(&**&self.data))?; }
        if self.created_at != 0u64 { w.write_with_tag(64, |w| w.write_uint64(*&self.created_at))?; }
        for (k, v) in self.metadata.iter() { w.write_with_tag(74, |w| w.write_map(2 + sizeof_len((k).len()) + sizeof_len((v).len()), 10, |w| w.write_string(&**k), 18, |w| w.write_string(&**v)))?; }
        Ok(())
    }
}

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Debug, Default, PartialEq, Clone)]
pub struct ApplicationResponse {
    pub kind: effect::application::mod_ApplicationResponse::OneOfkind,
}

impl<'a> MessageRead<'a> for ApplicationResponse {
    fn from_reader(r: &mut BytesReader, bytes: &'a [u8]) -> Result<Self> {
        let mut msg = Self::default();
        while !r.is_eof() {
            match r.next_tag(bytes) {
                Ok(10) => msg.kind = effect::application::mod_ApplicationResponse::OneOfkind::application(r.read_message::<effect::application::Application>(bytes)?),
                Ok(18) => msg.kind = effect::application::mod_ApplicationResponse::OneOfkind::err(r.read_message::<effect::common::AckErr>(bytes)?),
                Ok(t) => { r.read_unknown(bytes, t)?; }
                Err(e) => return Err(e),
            }
        }
        Ok(msg)
    }
}

impl MessageWrite for ApplicationResponse {
    fn get_size(&self) -> usize {
        0
        + match self.kind {
            effect::application::mod_ApplicationResponse::OneOfkind::application(ref m) => 1 + sizeof_len((m).get_size()),
            effect::application::mod_ApplicationResponse::OneOfkind::err(ref m) => 1 + sizeof_len((m).get_size()),
            effect::application::mod_ApplicationResponse::OneOfkind::None => 0,
    }    }

    fn write_message<W: WriterBackend>(&self, w: &mut Writer<W>) -> Result<()> {
        match self.kind {            effect::application::mod_ApplicationResponse::OneOfkind::application(ref m) => { w.write_with_tag(10, |w| w.write_message(m))? },
            effect::application::mod_ApplicationResponse::OneOfkind::err(ref m) => { w.write_with_tag(18, |w| w.write_message(m))? },
            effect::application::mod_ApplicationResponse::OneOfkind::None => {},
    }        Ok(())
    }
}

pub mod mod_ApplicationResponse {

use super::*;

#[derive(Debug, PartialEq, Clone)]
pub enum OneOfkind {
    application(effect::application::Application),
    err(effect::common::AckErr),
    None,
}

impl Default for OneOfkind {
    fn default() -> Self {
        OneOfkind::None
    }
}

}

