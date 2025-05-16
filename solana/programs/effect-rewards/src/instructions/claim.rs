use crate::*;
use anchor_spl::token::{Token, TokenAccount};

use effect_common::cpi;
use effect_staking::accounts::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        seeds = [b"reflection", recipient_token_account.mint.as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        seeds = [reflection_account.key().as_ref()],
        bump
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,
  
    #[account(
        mut,
        has_one = authority @ RewardErrors::Unauthorized,
        constraint = stake_account.weighted_amount >= reward_account.weighted_amount @ RewardErrors::Decreased,
    )]
    pub stake_account: Account<'info, StakeAccount>,
   
    #[account(
        mut, 
        seeds = [stake_account.key().as_ref()],
        bump,
        has_one = authority @ RewardErrors::Unauthorized)
    ]
    pub reward_account: Account<'info, RewardAccount>,

    #[account(
        mut,
        token::mint = recipient_token_account.mint,
        token::authority = authority,
     )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
   
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {

        // determine amount to claim
        let amount: u128 = self.reward_account.get_amount(self.reflection_account.rate);

        if amount == 0 {
            msg!("No rewards to claim");
            return Ok(());
        }

        // decrease the reflection pool
        self.reflection_account
            .remove_rewards_account(self.reward_account.reflection, self.reward_account.weighted_amount + amount)?;

        // re-enter the pool with the current stake
        self.reward_account.update(
            self.reflection_account.add_rewards_account(self.stake_account.weighted_amount, 0),
            self.stake_account.weighted_amount,
        )?;

        // pay-out pending reward
        transfer_tokens_from_vault!(
            self,
            reward_vault_token_account,
            recipient_token_account,
            &[&vault_seed!(self.reflection_account.key().as_ref())],
            amount.try_into().unwrap()
        )
    }
}
