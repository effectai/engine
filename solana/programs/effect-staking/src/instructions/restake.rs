use crate::*;
use anchor_spl::token::TokenAccount;
use constants::STAKE_MINIMUM_AMOUNT;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        constraint = vault_token_account.amount >= STAKE_MINIMUM_AMOUNT
            @ StakingErrors::AmountNotEnough,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = vault_token_account @ StakingErrors::InvalidVault,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake.time_unstake != 0 @ StakingErrors::AlreadyStaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Restake<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.stake.restake(self.vault_token_account.amount)
    }
}
