mod errors;
mod instructions;
mod macros;
mod security;
mod state;

use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;
use effect_common::*;
use instructions::*;

pub use errors::*;
pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_reward-keypair.json");

declare_program!(effect_staking);

#[program]
pub mod effect_reward {
    use super::*;

    pub fn init(ctx: Context<Init>, settings: ReflectionSettings) -> Result<()> {
        ctx.accounts.handler(settings)
    }

    pub fn topup(ctx: Context<Topup>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn sync(ctx: Context<Sync>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn migrate(ctx: Context<Migrate>, scope: Pubkey) -> Result<()> {
        ctx.accounts.handler(scope)
    }
}
