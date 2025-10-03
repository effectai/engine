use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod state;

pub use instructions::*;
pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_application-keypair.json");

declare_program!(effect_reward);

#[program]
pub mod effect_application {

    use super::*;

    pub fn register(
        ctx: Context<Register>,
        name: String,
        description: String,
        payout_strategy: PayoutStrategy,
    ) -> Result<()> {
        register::handler(ctx, name, description, payout_strategy)
    }
}
