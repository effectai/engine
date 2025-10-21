use std::{io, marker::PhantomData};

use async_trait::async_trait;
use futures::prelude::*;
use libp2p::StreamProtocol;
use libp2p_request_response::Codec as RequestResponseCodec;
use quick_protobuf::{BytesReader, MessageRead, MessageWrite, Writer};
use unsigned_varint::{aio, encode};

/// Request-response codec for quick-protobuf generated messages.
#[derive(Clone)]
pub struct QpbRRCodec<Req, Resp> {
    request_size_maximum: usize,
    response_size_maximum: usize,
    marker: PhantomData<(Req, Resp)>,
}

impl<Req, Resp> Default for QpbRRCodec<Req, Resp> {
    fn default() -> Self {
        Self {
            request_size_maximum: 1 * 1024 * 1024,
            response_size_maximum: 10 * 1024 * 1024,
            marker: PhantomData,
        }
    }
}

impl<Req, Resp> QpbRRCodec<Req, Resp> {
    #[allow(unused)]
    pub fn set_request_size_maximum(mut self, request_size_maximum: usize) -> Self {
        self.request_size_maximum = request_size_maximum;
        self
    }

    #[allow(unused)]
    pub fn set_response_size_maximum(mut self, response_size_maximum: usize) -> Self {
        self.response_size_maximum = response_size_maximum;
        self
    }
}

#[async_trait]
impl<Req, Resp> RequestResponseCodec for QpbRRCodec<Req, Resp>
where
    Req: Send + MessageWrite + for<'a> MessageRead<'a>,
    Resp: Send + MessageWrite + for<'a> MessageRead<'a>,
{
    type Protocol = StreamProtocol;
    type Request = Req;
    type Response = Resp;

    async fn read_request<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
    ) -> io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        read_message(io, self.request_size_maximum).await
    }

    async fn read_response<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
    ) -> io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        read_message(io, self.response_size_maximum).await
    }

    async fn write_request<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
        req: Self::Request,
    ) -> io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        write_message(io, req, self.request_size_maximum).await
    }

    async fn write_response<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
        resp: Self::Response,
    ) -> io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        write_message(io, resp, self.response_size_maximum).await
    }
}

async fn read_message<T, M>(io: &mut T, limit: usize) -> io::Result<M>
where
    T: AsyncRead + Unpin + Send,
    M: for<'a> MessageRead<'a>,
{
    let len = aio::read_usize(&mut *io).await.map_err(map_varint_err)?;

    if len > limit {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("message length {len} exceeds limit {limit}"),
        ));
    }

    let mut buf = vec![0u8; len];
    io.read_exact(&mut buf).await?;

    let mut reader = BytesReader::from_bytes(&buf);
    M::from_reader(&mut reader, &buf).map_err(map_pb_err)
}

async fn write_message<T, M>(io: &mut T, message: M, limit: usize) -> io::Result<()>
where
    T: AsyncWrite + Unpin + Send,
    M: MessageWrite,
{
    let size = message.get_size();

    if size > limit {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("message length {size} exceeds limit {limit}"),
        ));
    }

    let mut buf = Vec::with_capacity(size);
    {
        let mut writer = Writer::new(&mut buf);
        message.write_message(&mut writer).map_err(map_pb_err)?;
    }

    let mut len_buf = encode::usize_buffer();
    let prefix = encode::usize(buf.len(), &mut len_buf);

    io.write_all(prefix).await?;
    io.write_all(&buf).await?;
    io.flush().await?;
    Ok(())
}

fn map_varint_err(err: unsigned_varint::io::ReadError) -> io::Error {
    err.into()
}

fn map_pb_err(err: quick_protobuf::Error) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, err)
}
