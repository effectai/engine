use crate::*;
use effect_staking::{EffectStakingError, StakeAccount};

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
  
    #[account(
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake == 0 @ EffectStakingError::AlreadyUnstaked
    )]
    pub stake: Account<'info, StakeAccount>,
   
    #[account(
        init,
        payer = authority,
        space = RewardAccount::SIZE,
        seeds = [ b"rewards", authority.key().as_ref() ],
        bump,
    )]
    pub reward: Account<'info, RewardAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
   
    pub system_program: Program<'info, System>,
}

impl<'info> Enter<'info> {
    pub fn handler(&mut self, bump: u8) -> Result<()> {
        self.reward.init(
            self.authority.key(),
            bump,
            self.reflection.add_rewards_account(self.stake.xefx, 0),
            self.stake.xefx,
        )
    }
}
