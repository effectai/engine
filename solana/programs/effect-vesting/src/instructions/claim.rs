use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, address = vesting_account.vault_token_account @ VestingErrors::InvalidTokenAccount)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = recipient_token_account @ VestingErrors::WrongBeneficiary,
        constraint = Clock::get()?.unix_timestamp > vesting_account.start_time @ VestingErrors::NotStarted,
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let amount: u64 = self
            .vesting_account
            .claim( self.authority.key(), self.vault_token_account.amount, Clock::get()?.unix_timestamp)?;

        // TODO: below is not a requirement anymore, can be removed?
        // the pool must have enough funds for an emission
        require!(amount >= self.vesting_account.release_rate, VestingErrors::Underfunded);

        // transfer tokens from the vault back to the user
        transfer_tokens_from_vault!(self, recipient_token_account, seeds!(self.vesting_account), amount)
    }
}
