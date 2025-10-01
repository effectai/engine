use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::effect_application::accounts::Application;
use crate::RecipientManagerDataAccount;

#[derive(Accounts)]
#[instruction(manager_authority: Pubkey)]
pub struct Init<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub application_account: Account<'info, Application>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 4 + 8 + 1 + 32,
        seeds = [authority.key().as_ref(), manager_authority.key().as_ref(), application_account.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Init>, manager_authority: Pubkey) -> Result<()> {
    let recipient_manager_data_account = &mut ctx.accounts.recipient_manager_data_account;
    recipient_manager_data_account.manager_account = manager_authority;
    recipient_manager_data_account.application_account = ctx.accounts.application_account.key();
    recipient_manager_data_account.nonce = 0;
    recipient_manager_data_account.total_amount = 0;
    recipient_manager_data_account.mint = ctx.accounts.mint.key();
    recipient_manager_data_account.bump = ctx.bumps.recipient_manager_data_account;
    Ok(())
}
