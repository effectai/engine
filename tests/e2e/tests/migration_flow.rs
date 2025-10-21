use anyhow::Result;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "migration handoff test not yet implemented"]
async fn migration_handoff_flow() -> Result<()> {
    // TODO: seed migration claim, submit signed message, and validate staking genesis CPI.
    Ok(())
}

