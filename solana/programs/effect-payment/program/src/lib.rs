use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod security;
mod utils;
mod verifying_key;

use effect_payment_common::Payment;
use effect_payment_common::EFFECT_PAYMENT;
pub use instructions::*;

declare_id!(EFFECT_PAYMENT);

#[program]
pub mod effect_payment {

    use super::*;

    pub fn claim(
        ctx: Context<Claim>,
        min_nonce: u32,
        max_nonce: u32,
        total_amount: u64,
        pub_x: [u8; 32],
        pub_y: [u8; 32],
        proof: [u8; 256], // authority: Pubkey
    ) -> Result<()> {
        claim::handler(ctx, min_nonce, max_nonce, total_amount, pub_x, pub_y, proof)
    }

    pub fn create_payment_pool(
        ctx: Context<Create>,
        authorities: Vec<Pubkey>,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, authorities, amount)
    }

    //initialize a recipient/manager data account that holds the nonce
    pub fn init(ctx: Context<Init>, manager_authority: Pubkey) -> Result<()> {
        init::handler(ctx, manager_authority)
    }
}
