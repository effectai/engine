use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use codec::QpbRRCodec;
use futures::StreamExt;
use libp2p::swarm::{NetworkBehaviour, SwarmEvent};
use libp2p::{Multiaddr, StreamProtocol, Swarm, noise, tcp, yamux};
use libp2p_request_response as rr;
use net::task::TaskOutbound;
use proto::application::{ApplicationRequest, ApplicationResponse};
use proto::common::CtrlAck;
use proto::now_ms;
use proto::task::TaskCtrlReq;
use rand::{SeedableRng, rngs::StdRng};
use tokio::sync::mpsc;
use tokio::task::JoinHandle;
use tokio::time::{Interval, interval};
use zkp::generate_manager_keypair;

use crate::orchestrator::application::{ApplicationManager, handle_application_event};
use crate::orchestrator::task::{NetworkAction, TaskOrchestrator, handle_rr_event};
use crate::sequencer::{JobNotification, Sequencer};
use application::Application;
use domain::task::TaskSubmission;
use storage::Store;

const TASK_CTRL_PROTOCOL: &str = "/effect/task-ctrl/1";
const APPLICATION_CTRL_PROTOCOL: &str = "/effect/application-ctrl/1";

#[derive(NetworkBehaviour)]
pub struct EffectBehaviour {
    pub task_ctrl: rr::Behaviour<QpbRRCodec<TaskCtrlReq, CtrlAck>>,
    pub application_ctrl: rr::Behaviour<QpbRRCodec<ApplicationRequest, ApplicationResponse>>,
}

#[derive(Debug, Clone)]
pub struct ManagerConfig {
    pub listen_addr: Multiaddr,
    pub data_dir: PathBuf,
    pub seed_demo_task: bool,
}

impl Default for ManagerConfig {
    fn default() -> Self {
        Self {
            listen_addr: "/ip4/127.0.0.1/tcp/0".parse().expect("valid multiaddr"),
            data_dir: PathBuf::from("manager-data"),
            seed_demo_task: true,
        }
    }
}

enum ManagerCommand {
    RegisterApplication(Application),
    SubmitTask(TaskSubmission),
    Shutdown,
}

pub struct ManagerHandle {
    command_tx: mpsc::UnboundedSender<ManagerCommand>,
    join_handle: JoinHandle<Result<()>>,
    listen_addr: Multiaddr,
    store: Arc<Store>,
}

impl ManagerHandle {
    pub fn local_addr(&self) -> &Multiaddr {
        &self.listen_addr
    }

    pub fn store(&self) -> Arc<Store> {
        self.store.clone()
    }

    pub fn register_application(&self, application: Application) -> Result<()> {
        self.command_tx
            .send(ManagerCommand::RegisterApplication(application))
            .map_err(|_| anyhow::anyhow!("manager runtime terminated"))
    }

    pub fn submit_task(&self, submission: TaskSubmission) -> Result<()> {
        self.command_tx
            .send(ManagerCommand::SubmitTask(submission))
            .map_err(|_| anyhow::anyhow!("manager runtime terminated"))
    }

    pub async fn shutdown(self) -> Result<()> {
        let _ = self.command_tx.send(ManagerCommand::Shutdown);
        match self.join_handle.await {
            Ok(result) => result,
            Err(err) => Err(err.into()),
        }
    }
}

pub async fn spawn_manager(config: ManagerConfig) -> Result<ManagerHandle> {
    let store = Arc::new(Store::open(&config.data_dir)?);

    let mut key_rng = StdRng::from_entropy();
    let receipt_keypair = generate_manager_keypair(&mut key_rng);

    let mut task_orchestrator = TaskOrchestrator::new(store.clone(), receipt_keypair)?;
    let application_manager = ApplicationManager::new(store.clone())?;

    let mut job_sequencer = Sequencer::new(store.clone())?;
    let (job_tx, job_rx) = mpsc::unbounded_channel();
    task_orchestrator.set_job_notifier(job_tx);
    let mut swarm = build_swarm()?;
    swarm
        .listen_on(config.listen_addr.clone())
        .expect("valid listen address");

    let resume_actions = job_sequencer.reconcile(&mut task_orchestrator)?;
    if !resume_actions.is_empty() {
        execute_actions(&mut swarm, resume_actions);
    }

    let (command_tx, command_rx) = mpsc::unbounded_channel();
    let (listen_tx, listen_rx) = tokio::sync::oneshot::channel();

    tracing::info!("Manager starting");

    let handle = tokio::spawn(run_manager(
        swarm,
        task_orchestrator,
        application_manager,
        job_sequencer,
        job_rx,
        command_rx,
        interval(Duration::from_secs(5)),
        Some(listen_tx),
    ));

    let listen_addr = match listen_rx.await {
        Ok(addr) => addr,
        Err(err) => return Err(err.into()),
    };

    Ok(ManagerHandle {
        command_tx,
        join_handle: handle,
        listen_addr,
        store,
    })
}

pub async fn run_cli(config: ManagerConfig) -> Result<()> {
    let handle = spawn_manager(config).await?;
    tracing::info!(addr = %handle.local_addr(), "Manager listening");
    tokio::signal::ctrl_c().await?;
    handle.shutdown().await
}

async fn run_manager(
    mut swarm: Swarm<EffectBehaviour>,
    mut orchestrator: TaskOrchestrator,
    mut application: ApplicationManager,
    mut job_sequencer: Sequencer,
    mut job_notifications: mpsc::UnboundedReceiver<JobNotification>,
    mut commands: mpsc::UnboundedReceiver<ManagerCommand>,
    mut tick: Interval,
    mut listen_tx: Option<tokio::sync::oneshot::Sender<Multiaddr>>,
) -> Result<()> {
    loop {
        tokio::select! {
            swarm_event = swarm.select_next_some() => {
                match swarm_event {
                    SwarmEvent::Behaviour(EffectBehaviourEvent::ApplicationCtrl(event)) => {
                        handle_application_event(&mut swarm, &mut application, event);
                    }
                    SwarmEvent::Behaviour(EffectBehaviourEvent::TaskCtrl(event)) => {
                        handle_rr_event(&mut swarm, &mut orchestrator, &mut job_sequencer, event);
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        let actions = orchestrator.handle_worker_connected(peer_id);
                        execute_actions(&mut swarm, actions);
                    }
                    SwarmEvent::ConnectionClosed { peer_id, .. } => {
                        let actions = orchestrator.handle_worker_disconnected(&peer_id);
                        execute_actions(&mut swarm, actions);
                    }
                    SwarmEvent::NewListenAddr { address, .. } => {
                        if let Some(tx) = listen_tx.take() {
                            let listen = address.with_p2p(*swarm.local_peer_id()).unwrap();
                            let _ = tx.send(listen);
                        }
                    }
                    other => tracing::trace!(?other, "Swarm event"),
                }
            }
            Some(command) = commands.recv() => {
                match command {
                    ManagerCommand::RegisterApplication(application) => {
                        if let Err(err) = orchestrator.register_application(application) {
                            tracing::error!(?err, "Failed to register application");
                        }
                    }
                    ManagerCommand::SubmitTask(submission) => {
                        match job_sequencer.submit_job(&mut orchestrator, submission) {
                            Ok(actions) => execute_actions(&mut swarm, actions),
                            Err(err) => tracing::error!(?err, "Failed to create task"),
                        }
                    }
                    ManagerCommand::Shutdown => break,
                }
            }
            Some(notification) = job_notifications.recv() => {
                match job_sequencer.handle_notification(notification, &mut orchestrator) {
                    Ok(actions) => execute_actions(&mut swarm, actions),
                    Err(err) => tracing::error!(?err, "Failed to advance job"),
                }
            }
            _ = tick.tick() => {
                let actions = orchestrator.on_tick(now_ms());
                execute_actions(&mut swarm, actions);
            }
            else => break,
        }
    }

    Ok(())
}

fn execute_actions(swarm: &mut Swarm<EffectBehaviour>, actions: Vec<NetworkAction>) {
    for action in actions {
        match action {
            NetworkAction::SendTask { peer, payload } => {
                let request: TaskCtrlReq = TaskOutbound::Payload(payload).into();
                let request_id = swarm.behaviour_mut().task_ctrl.send_request(&peer, request);
                tracing::info!(%peer, ?request_id, "Sent task payload");
            }
            NetworkAction::SendReceipt { peer, receipt } => {
                let request: TaskCtrlReq = TaskOutbound::Receipt(receipt).into();
                let request_id = swarm.behaviour_mut().task_ctrl.send_request(&peer, request);
                tracing::info!(%peer, ?request_id, "Sent task receipt");
            }
        }
    }
}

fn build_swarm() -> Result<Swarm<EffectBehaviour>> {
    Ok(libp2p::SwarmBuilder::with_new_identity()
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_behaviour(|_| EffectBehaviour {
            application_ctrl: rr::Behaviour::with_codec(
                QpbRRCodec::<ApplicationRequest, ApplicationResponse>::default(),
                [(
                    StreamProtocol::new(&APPLICATION_CTRL_PROTOCOL),
                    rr::ProtocolSupport::Full,
                )],
                rr::Config::default(),
            ),
            task_ctrl: rr::Behaviour::with_codec(
                QpbRRCodec::<TaskCtrlReq, CtrlAck>::default(),
                [(
                    StreamProtocol::new(&TASK_CTRL_PROTOCOL),
                    rr::ProtocolSupport::Full,
                )],
                rr::Config::default(),
            ),
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(10)))
        .build())
}
