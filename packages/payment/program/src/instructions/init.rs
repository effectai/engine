use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::RecipientManagerDataAccount;

#[derive(Accounts)]
#[instruction(manager_authority: Pubkey)]
pub struct Init<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 64,
        seeds = [authority.key().as_ref(), manager_authority.key().as_ref()],
        bump
    )]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Init>, manager_authority: Pubkey) -> Result<()> {
    msg!("Initializing recipient manager data account");
    Ok(())
}
