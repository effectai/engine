use anyhow::Result;
use clap::Parser;
use libp2p::Multiaddr;
use worker_node::{WorkerConfig, spawn_worker};

#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Options {
    /// Multiaddress of the manager node
    #[arg(long)]
    manager: Multiaddr,
}

#[tokio::main]
async fn main() -> Result<()> {
    let opts = Options::parse();
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let handle = spawn_worker(WorkerConfig {
        manager_addr: opts.manager,
    })
    .await?;

    tokio::signal::ctrl_c().await?;
    handle.shutdown().await
}
