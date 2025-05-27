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

declare_id!("effphQKcAYeN6CkbygjnJUsuYXGUtkikSPZ6B8hSggC");

#[program]
pub mod effect_payment {
    use super::*;

    pub fn claim_proofs(
        ctx: Context<ClaimMultiple>,
        pub_x: [u8; 32],
        pub_y: [u8; 32],
        proof_data: Vec<ProofData>,
    ) -> Result<()> {
        claim_proofs::handler(ctx, pub_x, pub_y, proof_data)
    }

    pub fn create_payment_pool(ctx: Context<Create>, authority: Pubkey, amount: u64) -> Result<()> {
        create::handler(ctx, authority, amount)
    }

    //initialize a recipient/manager data account that holds the nonce
    pub fn init(ctx: Context<Init>, manager_authority: Pubkey) -> Result<()> {
        init::handler(ctx, manager_authority)
    }
}
