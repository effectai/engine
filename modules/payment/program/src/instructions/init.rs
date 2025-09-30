use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::RecipientManagerDataAccount;

#[derive(Accounts)]
#[instruction(manager_authority: Pubkey, application_pubkey: Pubkey)]
pub struct Init<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 4 + 8 + 1 + 32,
        seeds = [authority.key().as_ref(), manager_authority.key().as_ref(), application_pubkey.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Init>,
    manager_authority: Pubkey,
    application_pubkey: Pubkey,
) -> Result<()> {
    let recipient_manager_data_account = &mut ctx.accounts.recipient_manager_data_account;
    recipient_manager_data_account.manager_account = manager_authority;
    recipient_manager_data_account.application_account = application_pubkey;
    recipient_manager_data_account.nonce = 10;
    recipient_manager_data_account.total_amount = 500_000_000; // 500 tokens
    recipient_manager_data_account.bump = ctx.bumps.recipient_manager_data_account;
    recipient_manager_data_account.mint = ctx.accounts.mint.key();
    Ok(())
}
