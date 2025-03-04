use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi;
use effect_common::transfer_tokens_to_vault;
use effect_payment_common::PaymentAccount;
use effect_payment_common::RecipientPaymentDataAccount;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + 64,
        seeds = [recipient_token_account.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub recipient_data_account: Account<'info, RecipientPaymentDataAccount>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    Ok(())
}
