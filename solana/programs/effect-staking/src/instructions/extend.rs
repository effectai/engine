use crate::*;

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = authority @ EffectError::Unauthorized,
        constraint = stake.time_unstake == 0 @ EffectStakingError::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Extend<'info> {
    pub fn handler(&mut self, duration: u64) -> Result<()> {
        // test duration
        require!(duration > 0, EffectStakingError::DurationTooShort);

        // test new duration
        require!(
            self.stake.duration + duration <= DURATION_MAX.try_into().unwrap(),
            EffectStakingError::DurationTooLong
        );

        // extend stake
        self.stake.extend(duration)
    }
}
