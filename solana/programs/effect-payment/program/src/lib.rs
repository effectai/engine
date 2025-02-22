use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod state;
mod utils;
mod security;

pub use instructions::*;

declare_id!(EFFECT_PAYMENT);

#[program]
pub mod effect_payment {

    use super::*;

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx, signature, message)
    }

    pub fn create_payment_pool(
        ctx: Context<Create>,
        foreign_address: Vec<u8>,
        stake_start_time: i64,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, foreign_address, stake_start_time, amount)
    }

}
