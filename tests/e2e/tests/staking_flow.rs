use anyhow::Result;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "staking flow end-to-end test not yet implemented"]
async fn staking_reward_flow() -> Result<()> {
    // TODO: initialize validator, deploy staking/reward/vesting programs, and assert reward accruals.
    Ok(())
}
