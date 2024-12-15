use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod state;
mod utils;

use effect_migration_common::{EFFECT_MIGRATION};
pub use instructions::*;

declare_id!(EFFECT_MIGRATION);

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>, foreign_public_key: Vec<u8>) -> Result<()> {
        claim::handler(ctx, signature, message, foreign_public_key)
    }

    pub fn create_stake_claim(
        ctx: Context<Create>,
        foreign_public_key: Vec<u8>,
        stake_start_time: i64,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, foreign_public_key, stake_start_time, amount)
    }

}
