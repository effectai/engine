use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi;
use effect_common::transfer_tokens_to_vault;
use effect_payment_common::MerkleRootAccount;
use effect_payment_common::PaymentAccount;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 32 + 64,
        seeds = [b"merkle_root_account"],
        bump,
    )]
    pub merkle_root_account: Account<'info, MerkleRootAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    Ok(())
}
