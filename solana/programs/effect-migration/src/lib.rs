mod errors;
mod instructions;
mod macros;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;
use state::*;
declare_id!("13uv7xLUTN3gEtqPf7XLbLnbE5AuddWhDxAThc4YmjfY");

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(ctx: Context<ClaimStake>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim_stake::claim_stake(ctx, sig, message)
    }

    pub fn claim_tokens(ctx: Context<ClaimToken>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim_token::claim_token(ctx, sig, message)
    }

    pub fn create_token_claim(
        ctx: Context<CreateTokenClaim>,
        foreign_public_key: Vec<u8>,
        amount: u64,
    ) -> Result<()> {
        create_token_claim::handler(ctx, foreign_public_key, amount)
    }

    pub fn create_stake_claim(
        ctx: Context<CreateStakeClaim>,
        foreign_public_key: Vec<u8>,
        stake_start_time: i64,
        amount: u64,
    ) -> Result<()> {
        create_stake_claim::handler(ctx, foreign_public_key, stake_start_time, amount)
    }
}
