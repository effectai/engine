mod errors;
mod instructions;
mod macros;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;

use state::*;
declare_id!("BraRBZAVsUaxs46ob4gY5o9JvDHTGppChigyz7qwJm9g");

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(ctx: Context<ClaimStake>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim_stake::claim_stake(ctx, sig, message)
    }

    pub fn claim_tokens(ctx: Context<ClaimToken>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        claim_token::claim_token(ctx, sig, message)
    }

    pub fn create_stake_claim(
        ctx: Context<CreateClaim>,
        foreign_public_key: Vec<u8>,
        stake_start_time: i64,
        amount: u64,
    ) -> Result<()> {
        create_claim::handler(ctx, ClaimType::Stake { stake_start_time }, foreign_public_key, amount)
    }

    pub fn create_token_claim(
        ctx: Context<CreateClaim>,
        foreign_public_key: Vec<u8>,
        amount: u64,
    ) -> Result<()> {
        create_claim::handler(ctx, ClaimType::Token { }, foreign_public_key, amount)
    }

}
