use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::transfer_tokens_to_vault;
use effect_common::cpi;

use crate::PaymentAccount;
use crate::effect_application::accounts::Application;


#[derive(Accounts)]
#[instruction(manager_authority: Pubkey, amount: u64)]
pub struct Create<'info> {
    #[account(
        init, 
        seeds = [b"payment", manager_authority.as_ref(), application_account.key().as_ref(), mint.key().as_ref()],
        bump,
        payer = authority, 
        space = PaymentAccount::SIZE + 8,
    )]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut)]
    pub application_account: Account<'info, Application>,

    #[account(
        init,
        payer = authority, 
        token::mint = mint, 
        token::authority = payment_vault_token_account,
        seeds = [payment_account.key().as_ref()],
        bump
    )]
    pub payment_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account()]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Create>, manager_authority: Pubkey, amount: u64) -> Result<()> {
    ctx.accounts.payment_account.initialize(manager_authority, ctx.accounts.application_account.key(), ctx.accounts.mint.key(), ctx.accounts.user_token_account.key(), ctx.accounts.authority.key());
    transfer_tokens_to_vault!(ctx.accounts, payment_vault_token_account, amount)
}
