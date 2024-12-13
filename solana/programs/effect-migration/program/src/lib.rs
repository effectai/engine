use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod state;

pub use instructions::*;

declare_id!("BraRBZAVsUaxs46ob4gY5o9JvDHTGppChigyz7qwJm9g");

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>, foreign_public_key: Vec<u8>) -> Result<()> {
        claim::claim_stake(ctx, signature, message, foreign_public_key)
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
