use crate::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake == 0 @ EffectStakingError::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.stake.unstake(Clock::get()?.unix_timestamp)
    }
}
