use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub staker_tokens: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault.amount != 0 @ EffectError::VaultEmpty)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = vault @ EffectError::InvalidVault,
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake != 0 @ EffectStakingError::NotUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Withdraw<'info> {
    pub fn handler(&self) -> Result<()> {
        let amount: u64 = self
            .stake
            .withdraw(self.vault.amount, Clock::get()?.unix_timestamp);
        if amount > 0 {
            transfer_tokens_from_vault!(self, staker_tokens, seeds!(self.stake, &[self.stake.vault_bump]), amount)
        } else {
            Ok(())
        }
    }
}
