use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Topup<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = vault_token_account @ StakingErrors::InvalidVault,
        has_one = authority @ StakingErrors::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Topup<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // test amount
        require!(amount > 0, StakingErrors::AmountNotEnough);

        // get stake account and topup stake
        self.stake.topup(amount);

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, amount)
    }
}
