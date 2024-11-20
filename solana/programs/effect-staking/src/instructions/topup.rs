use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Topup<'info> {
    #[account(mut)]
    pub staker_tokens: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = vault @ EffectError::InvalidVault,
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake == 0 @ EffectStakingError::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Topup<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // test amount
        require!(amount > 0, EffectStakingError::AmountNotEnough);

        // get stake account and topup stake
        self.stake.topup(amount);

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, amount)
    }
}
