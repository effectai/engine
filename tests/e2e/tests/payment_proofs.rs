use anyhow::Result;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "payment proof verification test not yet implemented"]
async fn payment_proof_claim_flow() -> Result<()> {
    // TODO: generate Groth16 proof, claim payouts, and assert nonce and balance updates.
    Ok(())
}
