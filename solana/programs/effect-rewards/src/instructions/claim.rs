use crate::*;
use anchor_spl::token::{Token, TokenAccount};

use effect_common::cpi;
use effect_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
   
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
  
    #[account(mut, has_one = vault_token_account @ RewardErrors::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,
   
    #[account(mut, has_one = authority @ RewardErrors::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    
    #[account(
        has_one = authority @ RewardErrors::Unauthorized,
        constraint = stake.time_unstake == 0 @ RewardErrors::AlreadyUnstaked,
        constraint = stake.xefx >= reward.xefx @ RewardErrors::Decreased,
    )]
    pub stake: Account<'info, StakeAccount>,
   
    #[account(mut)]
    pub authority: Signer<'info>,
   
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // determine amount to claim
        let amount: u128 = self.reward.get_amount(self.reflection.rate);

        if amount == 0 {
            msg!("No rewards to claim");
            return Ok(());
        }

        // decrease the reflection pool
        self.reflection
            .remove_rewards_account(self.reward.reflection, self.reward.xefx + amount)?;

        // re-enter the pool with the current stake
        self.reward.update(
            self.reflection.add_rewards_account(self.stake.xefx, 0),
            self.stake.xefx,
        )?;

        // pay-out pending reward
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.reflection, self.vault_token_account),
            amount.try_into().unwrap()
        )
    }
}
