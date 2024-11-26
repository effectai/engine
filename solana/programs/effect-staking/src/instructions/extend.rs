use constants::STAKE_DURATION_MAX;

use crate::*;

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake.time_unstake == 0 @ StakingErrors::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Extend<'info> {
    pub fn handler(&mut self, duration: u64) -> Result<()> {
        // test duration
        require!(duration > 0, StakingErrors::DurationTooShort);

        // test new duration
        require!(
            self.stake.duration + duration <= STAKE_DURATION_MAX.try_into().unwrap(),
            StakingErrors::DurationTooLong
        );

        // extend stake
        self.stake.extend(duration)
    }
}
