use anyhow::Result;
use libp2p::Multiaddr;
use manager_node::{ManagerConfig, run_cli};

#[tokio::main]
async fn main() -> Result<()> {
    init_logging();

    let data_dir = std::env::var("MANAGER_DATA").unwrap_or_else(|_| "manager-data".to_string());
    let listen_addr: Multiaddr = std::env::var("MANAGER_LISTEN")
        .unwrap_or_else(|_| "/ip4/127.0.0.1/tcp/0".to_string())
        .parse()
        .expect("valid multiaddr");

    let config = ManagerConfig {
        listen_addr,
        data_dir: data_dir.into(),
        seed_demo_task: true,
    };

    run_cli(config).await
}

pub fn init_logging() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(tracing::level_filters::LevelFilter::INFO.into())
                .from_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .with_target(false)
        .try_init();
}
