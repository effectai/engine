use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod utils;

pub use instructions::*;

inject_declare_id_output!("../../../target/deploy/effect_migration-keypair.json");
declare_program!(effect_staking);

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
