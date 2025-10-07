use anchor_spl::token::TokenAccount;

use crate::{effect_staking::{accounts::StakeAccount, program::EffectStaking}, *};

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(
        constraint = stake_account.scope == reflection_account.settings.scope @ RewardErrors::ScopeMismatch,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        mut,
        seeds = [ stake_account.key().as_ref() ],
        bump,       
    )]
    pub reward_account: Account<'info, RewardAccount>,

    #[account(
        seeds = [ stake_account.key().as_ref() ],
        bump,
        seeds::program = stake_program.key()
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"reflection", stake_vault_token_account.mint.as_ref(), stake_account.scope.as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,
    
    pub stake_program: Program<'info, EffectStaking>
}

impl<'info> Sync<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // decrease the reflection pool
        self.reflection_account
            .remove_rewards_account(self.reward_account.reflection, self.reward_account.weighted_amount)?;

        // re-enter the pool with the current stake
        let amount: u128 = self.reward_account.get_amount(self.reflection_account.rate);
        self.reward_account.update(
            self.reflection_account.add_rewards_account(self.stake_account.weighted_amount, amount),
            self.stake_account.weighted_amount,
        )
    }
}
