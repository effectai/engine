mod errors;
mod instructions;
mod state;
mod utils;

use anchor_lang::prelude::*;
declare_id!("9hJuxBiFY82YiciAa6wERpHX8s9n1uvzhwaUSFoBJnZD");

use instructions::*;

#[program]
pub mod effect_migration {

    use super::*;

    pub fn claim(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8> ) -> Result<()> {
        claim::handler(ctx, sig, message)
    }

    pub fn create(ctx: Context<Create>, foreign_public_key: Vec<u8>, stake_start_time: i64, amount: u64) -> Result<()> {
        create::handler(ctx, foreign_public_key, stake_start_time, amount)
    }
}
