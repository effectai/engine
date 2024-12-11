use effect_rewards_common::RewardAccount;
use effect_staking_common::StakeAccount;

use crate::*;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut)]
    pub reward: Account<'info, RewardAccount>,
    #[account(
        constraint = stake.authority == reward.authority @ RewardErrors::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
}

impl<'info> Sync<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // decrease the reflection pool
        self.reflection
            .remove_rewards_account(self.reward.reflection, self.reward.weighted_amount)?;

        // re-enter the pool with the current stake
        let amount: u128 = self.reward.get_amount(self.reflection.rate);
        self.reward.update(
            self.reflection.add_rewards_account(self.stake.weighted_amount, amount),
            self.stake.weighted_amount,
        )
    }
}
