use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = vault_token_account @ StakingErrors::InvalidVault,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake.time_unstake != 0 @ StakingErrors::NotUnstaked,
        constraint = stake.time_unstake + i64::try_from(stake.duration).unwrap() <
            Clock::get()?.unix_timestamp @ StakingErrors::Locked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, constraint = vault_token_account.amount == 0 @ StakingErrors::VaultNotEmpty)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        close_vault!(self, seeds!(self.stake))
    }
}
