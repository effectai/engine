mod errors;
mod instructions;
mod state;

use anchor_lang::prelude::*;
declare_id!("39ZKpaDoLd4Q6g7cQHRmJetUTK2HHcbyZcH4LNR39jCk");

use instructions::*;

#[program]
pub mod solana_snapshot_migration {
    use anchor_lang::solana_program::message;

    use super::*;

    pub fn unlock_eth(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim::unlock_eth(ctx, sig, message)
    }

    pub fn unlock_eos(
        ctx: Context<Claim>,
        sig: Vec<u8>,
        serialized_tx_bytes: Vec<u8>,
    ) -> Result<()> {
        claim::unlock_eos(
            ctx,
            sig,
            serialized_tx_bytes
        )
    }

    pub fn create(ctx: Context<Create>, foreign_public_key: Vec<u8>, amount: u64) -> Result<()> {
        create::handler(ctx, foreign_public_key, amount)
    }
}
