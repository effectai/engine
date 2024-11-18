mod errors;
mod instructions;
mod state;

use anchor_lang::prelude::*;
declare_id!("39ZKpaDoLd4Q6g7cQHRmJetUTK2HHcbyZcH4LNR39jCk");

use instructions::*;

#[program]
pub mod solana_snapshot_migration {

    use super::*;

    pub fn claim(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8> ) -> Result<()> {
        claim::unlock_vault(ctx, sig, message)
    }

    pub fn create(ctx: Context<Create>, foreign_public_key: Vec<u8>, amount: u64) -> Result<()> {
        create::handler(ctx, foreign_public_key, amount)
    }
}
