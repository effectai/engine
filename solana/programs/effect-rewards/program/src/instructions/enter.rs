use anchor_spl::token::TokenAccount;
use effect_rewards_common::RewardAccount;
use effect_staking_common::{StakeAccount, StakingProgram};

use crate::*;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(
        mut,
        seeds = [ b"reflection", stake_vault_token_account.mint.key().as_ref() ],
        bump
    )]
    pub reflection: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        has_one = authority @ RewardErrors::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [ stake.key().as_ref() ],
        bump,
        seeds::program = stake_program.key()
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

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

    pub stake_program: Program<'info, StakingProgram>,
    pub system_program: Program<'info, System>,
}

impl<'info> Enter<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reward.init(
            self.authority.key(),
            self.reflection
                .add_rewards_account(self.stake.weighted_amount, 0),
            self.stake.weighted_amount,
        )
    }
}
