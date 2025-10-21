use anyhow::Result;
use clap::Parser;
use libp2p::Multiaddr;
use std::path::PathBuf;
use worker_node::{WorkerConfig, spawn_worker};

#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Options {
    /// Multiaddress of the manager node
    #[arg(long)]
    manager: Multiaddr,

    /// Directory for worker data
    #[arg(long, default_value = "worker-data")]
    data_dir: PathBuf,
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
        data_dir: opts.data_dir,
    })
    .await?;

    tokio::signal::ctrl_c().await?;
    handle.shutdown().await
}
