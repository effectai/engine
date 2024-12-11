
use effect_rewards_common::RewardAccount;
use effect_staking_common::StakeAccount;

use crate::*;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
  
    #[account(
        mut,
        has_one = authority @ RewardErrors::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
   
    #[account(
        init,
        payer = authority,
        space = 8 + RewardAccount::SIZE,
        seeds = [ stake.key().as_ref() ],
        bump,
    )]
    pub reward: Account<'info, RewardAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
   
    pub system_program: Program<'info, System>,
}

impl<'info> Enter<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reward.init(
            self.authority.key(),
            self.reflection.add_rewards_account(self.stake.weighted_amount, 0),
            self.stake.weighted_amount,
        )
    }
}
