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

    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128, scope: Pubkey) -> Result<()> {
        ctx.accounts.handler(amount, duration, scope)
    }

    pub fn stake_genesis(
        ctx: Context<GenesisStake>,
        amount: u64,
        stake_start_time: i64,
    ) -> Result<()> {
        ctx.accounts.handler(amount, stake_start_time)
    }

    /// Start the unstake duration.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// Top-up `amount` of [NOS](/tokens/token) of a [StakeAccount](#stake-account).
    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// Close a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn redeem(ctx: Context<Redeem>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    pub fn update_authority(ctx: Context<UpdateAuthority>) -> Result<()> {
        ctx.accounts.handler()
    }
}
