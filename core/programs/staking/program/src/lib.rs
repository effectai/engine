mod constants;
mod errors;
mod instructions;
mod macros;
mod state;

use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;

use effect_common::*;

pub use errors::*;
pub use instructions::*;
pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_staking-keypair.json");

declare_program!(effect_migration);
declare_program!(effect_vesting);
declare_program!(effect_reward);

#[program]
pub mod effect_staking {
    use super::*;

    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        duration: u128,
        scope: Pubkey,
        allow_topup: bool,
    ) -> Result<()> {
        ctx.accounts.handler(amount, duration, scope, allow_topup)
    }

    pub fn stake_genesis(
        ctx: Context<GenesisStake>,
        amount: u64,
        stake_start_time: i64,
    ) -> Result<()> {
        ctx.accounts.handler(amount, stake_start_time)
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn charge(ctx: Context<Charge>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    pub fn migrate(ctx: Context<Migrate>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn invest(ctx: Context<Invest>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }
}
