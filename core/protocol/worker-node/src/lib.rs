use std::time::Duration;

use anyhow::{Context, Result};
use codec::QpbRRCodec;
use futures::StreamExt;
use libp2p::swarm::{NetworkBehaviour, SwarmEvent};
use libp2p::{Multiaddr, PeerId, StreamProtocol, Swarm, noise, tcp, yamux};
use libp2p_request_response as rr;
use proto::common::CtrlAck;
use proto::task::{TaskCtrlReq, TaskMessage, TaskPayload};
use proto::{ack_err, ack_ok, now_ms, now_timestamp_i32};
use serde_json::{Value, json};
use tokio::sync::oneshot;
use tokio::task::JoinHandle;

const CTRL_PROTOCOL: &str = "/effect/task-ctrl/1";

#[derive(NetworkBehaviour)]
struct WorkerBehaviour {
    ctrl: rr::Behaviour<QpbRRCodec<TaskCtrlReq, CtrlAck>>,
}

#[derive(Debug, Clone)]
pub struct WorkerConfig {
    pub manager_addr: Multiaddr,
}

pub struct WorkerHandle {
    shutdown_tx: Option<oneshot::Sender<()>>,
    join_handle: JoinHandle<Result<()>>,
}

impl WorkerHandle {
    pub async fn shutdown(mut self) -> Result<()> {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        match self.join_handle.await {
            Ok(result) => result,
            Err(err) => Err(err.into()),
        }
    }
}

pub async fn spawn_worker(config: WorkerConfig) -> Result<WorkerHandle> {
    let (shutdown_tx, shutdown_rx) = oneshot::channel();
    let join_handle = tokio::spawn(run_worker(config, shutdown_rx));
    Ok(WorkerHandle {
        shutdown_tx: Some(shutdown_tx),
        join_handle,
    })
}

async fn run_worker(config: WorkerConfig, mut shutdown_rx: oneshot::Receiver<()>) -> Result<()> {
    let mut swarm = build_swarm()?;
    swarm
        .dial(config.manager_addr.clone())
        .context("failed to dial manager")?;

    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::Behaviour(WorkerBehaviourEvent::Ctrl(event)) => {
                        handle_rr_event(&mut swarm, event);
                    }
                    other => tracing::trace!(?other, "worker swarm event"),
                }
            }
            _ = &mut shutdown_rx => {
                tracing::info!("Worker shutting down");
                break;
            }
        }
    }

    Ok(())
}

fn handle_rr_event(swarm: &mut Swarm<WorkerBehaviour>, event: rr::Event<TaskCtrlReq, CtrlAck>) {
    match event {
        rr::Event::Message { peer, message, .. } => match message {
            rr::Message::Request {
                request, channel, ..
            } => {
                let response = match request.kind {
                    proto::task::mod_TaskCtrlReq::OneOfkind::task_payload(TaskPayload {
                        id,
                        title,
                        template_data,
                        ..
                    }) => {
                        tracing::info!(%peer, %id, %title, "Worker received task payload");
                        let _ = swarm.behaviour_mut().ctrl.send_response(channel, ack_ok());

                        send_task_message(
                            swarm,
                            &peer,
                            &id,
                            "accept",
                            json!({ "status": "accepted", "ts": now_ms() }),
                        );

                        send_task_message(
                            swarm,
                            &peer,
                            &id,
                            "completed",
                            json!({ "result": "dummy result", "ts": now_ms() }),
                        );

                        return;
                    }
                    proto::task::mod_TaskCtrlReq::OneOfkind::task_message(message) => {
                        tracing::info!(
                            %peer,
                            task_id = %message.task_id,
                            event = %message.type_pb,
                            "Worker received task message"
                        );
                        ack_ok()
                    }
                    proto::task::mod_TaskCtrlReq::OneOfkind::None => {
                        ack_err(400, "empty TaskCtrlReq")
                    }
                };

                if swarm
                    .behaviour_mut()
                    .ctrl
                    .send_response(channel, response)
                    .is_err()
                {
                    tracing::warn!(%peer, "Worker failed to send response");
                }
            }
            rr::Message::Response {
                request_id,
                response,
            } => {
                tracing::info!(%peer, ?request_id, ?response, "Worker received response");
            }
        },
        rr::Event::OutboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Worker outbound failure");
        }
        rr::Event::InboundFailure { peer, error, .. } => {
            tracing::warn!(%peer, ?error, "Worker inbound failure");
        }
        rr::Event::ResponseSent { peer, .. } => {
            tracing::debug!(%peer, "Worker response sent");
        }
    }
}

fn send_task_message(
    swarm: &mut Swarm<WorkerBehaviour>,
    peer: &PeerId,
    task_id: &str,
    event: &str,
    payload: Value,
) {
    let body = serde_json::to_vec(&payload).unwrap_or_default();
    let message = TaskCtrlReq {
        kind: proto::task::mod_TaskCtrlReq::OneOfkind::task_message(TaskMessage {
            task_id: task_id.to_string(),
            type_pb: event.to_string(),
            data: body,
            timestamp: now_timestamp_i32(),
        }),
    };

    let request_id = swarm.behaviour_mut().ctrl.send_request(peer, message);
    tracing::debug!(%task_id, %event, ?request_id, "Worker sent task update");
}

fn build_swarm() -> Result<Swarm<WorkerBehaviour>> {
    Ok(libp2p::SwarmBuilder::with_new_identity()
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_behaviour(|_| WorkerBehaviour {
            ctrl: rr::Behaviour::with_codec(
                QpbRRCodec::<TaskCtrlReq, CtrlAck>::default(),
                [(
                    StreamProtocol::new(CTRL_PROTOCOL),
                    rr::ProtocolSupport::Full,
                )],
                rr::Config::default(),
            ),
        })?
        .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(30)))
        .build())
}
