use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = authority @ VestingErrors::Unauthorized,
        has_one = vault_token_account @ VestingErrors::InvalidVault,
        constraint = vesting_account.is_closeable || vault_token_account.amount == 0 @ VestingErrors::NotCloseable
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(self, user_token_account, seeds!(self.vesting_account), self.vault_token_account.amount)?;
        close_vault!(self, seeds!(self.vesting_account))
    }
}
