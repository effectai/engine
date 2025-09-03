
use anchor_spl::token::TokenAccount;

use effect_staking::{accounts::StakeAccount, program::EffectStaking};

use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        seeds = [b"reflection", stake_vault_token_account.mint.as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,
    
    #[account(
        mut,
        close = authority,
        seeds = [ stake_account.key().as_ref() ],
        bump,       
    )]
    pub reward_account: Account<'info, RewardAccount>,
   
    #[account(
        mut,
        has_one = authority @ RewardErrors::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [ stake_account.key().as_ref() ],
        bump,
        seeds::program = stake_program.key()
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub stake_program: Program<'info, EffectStaking>,
}

impl<'info> Close<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reflection_account
            .remove_rewards_account(self.reward_account.reflection, self.reward_account.weighted_amount)
    }
}
