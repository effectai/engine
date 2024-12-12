
use effect_rewards_common::RewardAccount;

use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    pub reflection_account: Account<'info, ReflectionAccount>,
    
    #[account(mut, close = authority, has_one = authority @ RewardErrors::Unauthorized)]
    pub reward_account: Account<'info, RewardAccount>,
   
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Close<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reflection_account
            .remove_rewards_account(self.reward_account.reflection, self.reward_account.weighted_amount)
    }
}
