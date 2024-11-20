use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub staker_tokens: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = vault @ EffectError::InvalidVault,
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake != 0 @ EffectStakingError::NotUnstaked,
        constraint = stake.time_unstake + i64::try_from(stake.duration).unwrap() <
            Clock::get()?.unix_timestamp @ EffectStakingError::Locked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, constraint = vault.amount == 0 @ EffectError::VaultNotEmpty)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        close_vault!(self, seeds!(self.stake, self.vault))
    }
}
