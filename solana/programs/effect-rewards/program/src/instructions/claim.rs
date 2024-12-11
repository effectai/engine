use crate::*;
use anchor_spl::token::{Token, TokenAccount};

use effect_common::cpi;
use effect_rewards_common::RewardAccount;
use effect_staking_common::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
   
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
  
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
   
    #[account(mut, has_one = authority @ RewardErrors::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    
    #[account(
        has_one = authority @ RewardErrors::Unauthorized,
        constraint = stake.weighted_amount >= reward.weighted_amount @ RewardErrors::Decreased,
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
            .remove_rewards_account(self.reward.reflection, self.reward.weighted_amount + amount)?;

        // re-enter the pool with the current stake
        self.reward.update(
            self.reflection.add_rewards_account(self.stake.weighted_amount, 0),
            self.stake.weighted_amount,
        )?;

        // pay-out pending reward
        transfer_tokens_from_vault!(
            self,
            user,
            &[&vault_seed!()],
            amount.try_into().unwrap()
        )
    }
}
