use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod security;
mod utils;

use effect_payment_common::Payment;
use effect_payment_common::EFFECT_PAYMENT;
pub use instructions::*;

declare_id!(EFFECT_PAYMENT);

#[program]
pub mod effect_payment {

    use super::*;

    pub fn claim(
        ctx: Context<Claim>,
        payment: Payment,
        authority: Pubkey,
        signature: Vec<u8>,
    ) -> Result<()> {
        claim::handler(ctx, payment, authority, signature)
    }

    pub fn create_payment_pool(
        ctx: Context<Create>,
        authorities: Vec<Pubkey>,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, authorities, amount)
    }

    pub fn init(ctx: Context<Init>) -> Result<()> {
        init::handler(ctx)
    }
}
