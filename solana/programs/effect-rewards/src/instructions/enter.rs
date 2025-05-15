use anchor_spl::token::{Mint, TokenAccount};

use crate::*;

use effect_staking::{accounts::StakeAccount, program::EffectStaking};

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(
        mut,
        seeds = [ b"reflection", mint.key().as_ref() ],
        bump
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        has_one = authority @ RewardErrors::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [ stake_account.key().as_ref() ],
        bump,
        seeds::program = stake_program.key(),
        token::mint = mint,
        token::authority = stake_vault_token_account,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + RewardAccount::SIZE,
        seeds = [ stake_account.key().as_ref() ],
        bump,
    )]
    pub reward_account: Account<'info, RewardAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,
    pub stake_program: Program<'info, EffectStaking>,
    pub system_program: Program<'info, System>,
}

impl<'info> Enter<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reward_account.init(
            self.authority.key(),
            self.reflection_account
                .add_rewards_account(self.stake_account.weighted_amount, 0),
            self.stake_account.weighted_amount,
        )
    }
}
