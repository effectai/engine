use anyhow::Result;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "persistence / restart test not yet implemented"]
async fn persistence_restart_reconciliation() -> Result<()> {
    // TODO: restart manager and workers mid-job and verify sled-backed state reconciliation.
    Ok(())
}
