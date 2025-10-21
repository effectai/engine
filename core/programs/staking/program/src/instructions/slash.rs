use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::id::ADMIN_AUTHORITY;

#[derive(Accounts)]
#[instruction()]
pub struct Slash<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        token::mint = mint,
        token::authority = stake_vault_token_account,
        seeds = [ stake_account.key().as_ref() ],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut, address = ADMIN_AUTHORITY)]
    pub authority: Signer<'info>,

    #[account(
        token::mint = mint,
        token::authority = authority.key(),
    )]
    pub receiver_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Slash<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        require!(
            amount <= self.stake_account.amount,
            StakingErrors::AmountNotEnough
        );

        // reduce stake account amount
        self.stake_account.amount = self
            .stake_account
            .amount
            .checked_sub(amount)
            .ok_or(StakingErrors::AmountNotEnough)?;

        // transfer the tokens to the receiver
        transfer_tokens_from_vault!(
            self,
            stake_vault_token_account,
            receiver_token_account,
            &[&vault_seed!(self.stake_account.key())],
            amount
        )?;

        Ok(())
    }
}
