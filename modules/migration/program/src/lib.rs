use anchor_lang::prelude::*;

// mod effect_staking_env;
mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod utils;

use effect_common::declare_effect_program;
pub use instructions::*;

#[cfg(feature = "localnet")]
declare_id!("8hh1mwDGo66tHjmrF34rFo7m1msyoHR3QfNUd1bXzGQo");
#[cfg(feature = "mainnet")]
declare_id!("effM4rzQbgZD8J5wkubJbSVxTgRFWtatQcQEgYuwqrR");

declare_effect_program!(effect_staking, effect_staking_localnet);

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim_stake(
        ctx: Context<ClaimStake>,
        signature: Vec<u8>,
        message: Vec<u8>,
    ) -> Result<()> {
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
