use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod utils;
mod verifying_key;

pub use instructions::*;
pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_payment-keypair.json");

declare_program!(effect_application);

#[program]
pub mod effect_payment {

    use super::*;

    pub fn claim_proofs(
        ctx: Context<Claim>,
        pub_x: [u8; 32],
        pub_y: [u8; 32],
        min_nonce: u32,
        max_nonce: u32,
        total_amount: u64,
        proof: [u8; 256],
    ) -> Result<()> {
        claim_proofs::handler(ctx, pub_x, pub_y, min_nonce, max_nonce, total_amount, proof)
    }

    pub fn create_payment_pool(
        ctx: Context<Create>,
        manager_authority: Pubkey,
        amount: u64,
    ) -> Result<()> {
        create::handler(ctx, manager_authority, amount)
    }

    //initialize a recipient/manager/application data account that holds the nonce
    pub fn init(ctx: Context<Init>, manager_authority: Pubkey) -> Result<()> {
        init::handler(ctx, manager_authority)
    }

    //Redeem your VC's into a stake account
    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        redeem::handler(ctx)
    }
}
