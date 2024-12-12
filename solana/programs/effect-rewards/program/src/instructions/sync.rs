use effect_rewards_common::RewardAccount;
use effect_staking_common::StakeAccount;

use crate::*;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut)]
    pub reward_account: Account<'info, RewardAccount>,
    #[account(
        constraint = stake_account.authority == reward_account.authority @ RewardErrors::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub reflection_account: Account<'info, ReflectionAccount>,
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
