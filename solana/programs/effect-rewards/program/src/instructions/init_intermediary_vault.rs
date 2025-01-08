

use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitIntermediaryVault<'info> {
    #[account(
        seeds = [ b"reflection", mint.key().as_ref() ],
        bump
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        token::mint = mint,
        token::authority = reward_vault_token_account,
        seeds = [ reflection_account.key().as_ref() ],
        bump,
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = intermediate_reward_vault_token_account,
        seeds = [ reward_vault_token_account.key().as_ref() ],
        bump,
    )]
    pub intermediate_reward_vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitIntermediaryVault<'info> {
    pub fn handler(&mut self) -> Result<()> {
      Ok(())
    }
}
