use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod state;
mod utils;
mod security;

use effect_migration_common::EFFECT_MIGRATION;
pub use instructions::*;

declare_id!(EFFECT_MIGRATION);

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim::handler(ctx, signature, message)
    }

    pub fn create_stake_claim(
        ctx: Context<Create>,
        foreign_address: Vec<u8>,
        stake_start_time: i64,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, foreign_address, stake_start_time, amount)
    }

    pub fn destroy_claim(ctx: Context<Destroy>) -> Result<()> {
        destroy::handler(ctx)
    }

}
