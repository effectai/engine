use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;
use effect_vesting_common::VestingAccount;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority @ VestingErrors::Unauthorized,
        constraint = vesting_account.is_closeable || vesting_vault_token_account.amount == 0 @ VestingErrors::NotCloseable
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        mut,
        seeds = [vesting_account.key().as_ref()],
        bump
    )]
    pub vesting_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(
            self,
            vesting_vault_token_account,
            recipient_token_account,
            &[seeds!(self.vesting_account.key())],
            self.vesting_vault_token_account.amount
        )?;
        close_vault!(self, vesting_vault_token_account, &[seeds!(self.vesting_account.key())])
    }
}
