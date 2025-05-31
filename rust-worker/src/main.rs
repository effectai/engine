use libp2p::{
    futures::StreamExt,
    ping,
    relay,
    request_response,
    swarm::{NetworkBehaviour, SwarmEvent},
    Multiaddr,
    SwarmBuilder,
    StreamProtocol,
};
use std::error::Error;
use std::io;
use std::time::{SystemTime, UNIX_EPOCH};
use futures::prelude::*;
use prost::Message;
use async_trait::async_trait;

// Include the generated protobuf code
mod proto {
    include!(concat!(env!("OUT_DIR"), "/messages.rs"));
}

use proto::{RequestToWork, RequestToWorkResponse, EffectProtocolMessage};


static RELAY_ADDR: &str = "/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3KooWAb9rbnCHB9cgNgCcbrmtj73KKBrw5GkNgAC4SQRf9cPb";
static ACCESS_CODE: &str = "8b1ssect";

#[derive(Debug, Clone, Default)]
struct WorkProtocolCodec;

#[async_trait]
impl request_response::Codec for WorkProtocolCodec {
    type Protocol = StreamProtocol;
    type Request = RequestToWork;
    type Response = RequestToWorkResponse;

    async fn read_request<T>(
	&mut self,
	_protocol: &StreamProtocol,
	io: &mut T,
    ) -> io::Result<RequestToWork>
    where
	T: AsyncRead + Unpin + Send,
    {
	// read varint length (javascript uses lenght-prefixed)
	let mut length_buf = [0u8; 1];
	io.read_exact(&mut length_buf).await?;

	// decode varint (bit hacky)
	// TODO: proper varint decoding, this is a bit hacky
	let length = if length_buf[0] & 0x80 == 0 {
	    length_buf[0] as usize
	} else {
	    // read a second byte (in case of longer messages)
	    let mut second_byte = [0u8; 1];
	    io.read_exact(&mut second_byte).await?;
	    ((length_buf[0] & 0x7F) as usize) | ((second_byte[0] as usize) << 7)
	};

	println!("📥 Reading message with length: {}", length);

	// read message
	let mut buf = vec![0u8; length];
	io.read_exact(&mut buf).await?;

	println!("📥 Received request bytes: {:?} (length: {})", buf, buf.len());

	let wrapper = EffectProtocolMessage::decode(&buf[..])
	    .map_err(|e| {
		println!("❌ Failed to decode wrapper: {}", e);
		io::Error::new(io::ErrorKind::InvalidData, e)
	    })?;

	match wrapper.message {
	    Some(proto::effect_protocol_message::Message::RequestToWork(request)) => {
		println!("📥 Decoded request: {:?}", request);
		Ok(request)
	    }
	    _ => {
		println!("❌ No RequestToWork found in wrapper");
		Err(io::Error::new(io::ErrorKind::InvalidData, "Expected RequestToWork"))
	    }
	}
    }

    async fn read_response<T>(
	&mut self,
	_protocol: &StreamProtocol,
	io: &mut T,
    ) -> io::Result<RequestToWorkResponse>
    where
	T: AsyncRead + Unpin + Send,
    {
	// TODO: again, varint readin needs to be done properly
	let mut length_buf = [0u8; 1];
	io.read_exact(&mut length_buf).await?;

	let length = if length_buf[0] & 0x80 == 0 {
	    length_buf[0] as usize
	} else {
	    let mut second_byte = [0u8; 1];
	    io.read_exact(&mut second_byte).await?;
	    ((length_buf[0] & 0x7F) as usize) | ((second_byte[0] as usize) << 7)
	};

	println!("📥 Reading response with length: {}", length);

	let mut buf = vec![0u8; length];
	io.read_exact(&mut buf).await?;

	println!("📥 Received response bytes: {:?} (length: {})", buf, buf.len());

	let wrapper = EffectProtocolMessage::decode(&buf[..])
	    .map_err(|e| {
		println!("❌ Failed to decode wrapper: {}", e);
		io::Error::new(io::ErrorKind::InvalidData, e)
	    })?;

	match wrapper.message {
	    Some(proto::effect_protocol_message::Message::RequestToWorkResponse(response)) => {
		println!("📥 Decoded response: {:?}", response);
		Ok(response)
	    }
	    _ => {
		println!("❌ No RequestToWorkResponse found in wrapper");
		Err(io::Error::new(io::ErrorKind::InvalidData, "Expected RequestToWorkResponse"))
	    }
	}
    }

    async fn write_request<T>(
	&mut self,
	_protocol: &StreamProtocol,
	io: &mut T,
	req: RequestToWork,
    ) -> io::Result<()>
    where
	T: AsyncWrite + Unpin + Send,
    {
	let wrapper = EffectProtocolMessage {
	    message: Some(proto::effect_protocol_message::Message::RequestToWork(req.clone())),
	};

	let mut buf = Vec::new();
	wrapper.encode(&mut buf)
	    .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

	println!("📤 Sending request bytes: {:?} (length: {})", buf, buf.len());
	println!("📤 Request data: {:?}", req);

	// TODO: proper varint writing, this is a bit hacky
	let length = buf.len();
	if length < 128 {
	    io.write_all(&[length as u8]).await?;
	} else {
	    let first_byte = (length & 0x7F) as u8 | 0x80;
	    let second_byte = (length >> 7) as u8;
	    io.write_all(&[first_byte, second_byte]).await?;
	}

	io.write_all(&buf).await?;
	io.close().await?;
	Ok(())
    }

    async fn write_response<T>(
	&mut self,
	_protocol: &StreamProtocol,
	io: &mut T,
	res: RequestToWorkResponse,
    ) -> io::Result<()>
    where
	T: AsyncWrite + Unpin + Send,
    {
	let wrapper = EffectProtocolMessage {
	    message: Some(proto::effect_protocol_message::Message::RequestToWorkResponse(res.clone())),
	};

	let mut buf = Vec::new();
	wrapper.encode(&mut buf)
	    .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

	println!("📤 Sending response bytes: {:?} (length: {})", buf, buf.len());
	println!("📤 Response data: {:?}", res);

	// TODO: proper varint writing
	let length = buf.len();
	if length < 128 {
	    io.write_all(&[length as u8]).await?;
	} else {
	    let first_byte = (length & 0x7F) as u8 | 0x80;
	    let second_byte = (length >> 7) as u8;
	    io.write_all(&[first_byte, second_byte]).await?;
	}

	io.write_all(&buf).await?;
	io.close().await?;
	Ok(())
    }
}

#[derive(NetworkBehaviour)]
struct Behaviour {
    relay_client: relay::client::Behaviour,
    ping: ping::Behaviour,
    work_protocol: request_response::Behaviour<WorkProtocolCodec>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("Starting libp2p client with protobuf messaging...");

    let mut swarm = SwarmBuilder::with_new_identity()
	.with_tokio()
	.with_tcp(
	    Default::default(),
	    libp2p::noise::Config::new,
	    libp2p::yamux::Config::default,
	)?
	.with_websocket(
	    libp2p::noise::Config::new,
	    libp2p::yamux::Config::default,
	)
	.await?
	.with_relay_client(
	    libp2p::noise::Config::new,
	    libp2p::yamux::Config::default,
	)?
	.with_behaviour(|_keypair, relay_client| {
	    let work_protocol = request_response::Behaviour::with_codec(
		WorkProtocolCodec,
		[(StreamProtocol::new("/effectai/0.0.2"), request_response::ProtocolSupport::Full)],
		request_response::Config::default(),
	    );

	    Behaviour {
		relay_client,
		ping: ping::Behaviour::new(ping::Config::new()),
		work_protocol,
	    }
	})?
	.build();

    let relay_address: Multiaddr = RELAY_ADDR
	.parse()
	.expect("Failed to parse relay multiaddress");

    swarm.dial(relay_address.clone())?;
    println!("Dialing relay at: {}", relay_address);

    // for now, we just sent 1 work request upon connecting
    let mut message_sent = false;

    loop {
	match swarm.select_next_some().await {
	    SwarmEvent::NewListenAddr { address, .. } => {
		println!("🎧 Local node is listening on {address}");
	    }
	    SwarmEvent::Behaviour(BehaviourEvent::Ping(ping::Event {
		peer,
		result: Ok(rtt),
		..
	    })) => {
		println!("🏓 Ping to {peer} succeeded in {rtt:?}");
	    }
	    SwarmEvent::Behaviour(BehaviourEvent::Ping(ping::Event {
		peer,
		result: Err(failure),
		..
	    })) => {
		println!("❌ Ping to {peer} failed: {failure:?}");
	    }
	    SwarmEvent::Behaviour(BehaviourEvent::RelayClient(event)) => {
		println!("🔄 Relay client event: {event:?}");
	    }
	    SwarmEvent::Behaviour(BehaviourEvent::WorkProtocol(event)) => {
		match event {
		    request_response::Event::Message { peer, message, connection_id: _ } => {
			match message {
			    request_response::Message::Request { request, channel, .. } => {
				println!("📨 Received work request from {peer}: {request:?}");

				// Send response
				let response = RequestToWorkResponse {
				    accepted: true,
				    message: "Work accepted!".to_string(),
				};

				if let Err(e) = swarm.behaviour_mut().work_protocol.send_response(channel, response) {
				    println!("❌ Failed to send response: {e:?}");
				}
			    }
			    request_response::Message::Response { response, .. } => {
				println!("📬 Received work response from {peer}: {response:?}");
			    }
			}
		    }
		    request_response::Event::OutboundFailure { peer, error, .. } => {
			println!("❌ Outbound request failed to {peer:?}: {error:?}");
		    }
		    request_response::Event::InboundFailure { peer, error, .. } => {
			println!("❌ Inbound request failed from {peer:?}: {error:?}");
		    }
		    request_response::Event::ResponseSent { peer, .. } => {
			println!("✅ Response sent to {peer}");
		    }
		}
	    }
	    SwarmEvent::ConnectionEstablished {
		peer_id, endpoint, ..
	    } => {
		println!("✅ Connected to {peer_id} via {endpoint:?}");

		// send a message to the relay upon connecting
		// TODO: address for recipient
		if !message_sent && peer_id.to_string().contains("12D3KooWAb9rbnCHB9cgNgCcbrmtj73KKBrw5GkNgAC4SQRf9cPb") {
		    let request = RequestToWork {
			timestamp: SystemTime::now()
			    .duration_since(UNIX_EPOCH)
			    .unwrap()
			    .as_secs() as u32,
			recipient: "relay-node".to_string(),
			nonce: 12345,
			access_code: Some(ACCESS_CODE.to_string()),
		    };

		    let request_id = swarm.behaviour_mut().work_protocol.send_request(&peer_id, request);
		    println!("📤 Sent work request {request_id:?} to {peer_id}");
		    message_sent = true;
		}
	    }
	    SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
		println!("❌ Connection to {peer_id} closed: {cause:?}");
	    }
	    SwarmEvent::OutgoingConnectionError { peer_id, error, .. } => {
		println!("❌ Failed to connect to {peer_id:?}: {error}");
	    }
	    _ => {}
	}
    }
}
