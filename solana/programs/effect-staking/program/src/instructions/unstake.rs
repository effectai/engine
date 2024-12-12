use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi;
use effect_common::{
    constants::{SECONDS_PER_DAY, UNSTAKE_DELAY_DAYS},
};
use effect_rewards_common::RewardProgram;
use effect_staking_common::StakeAccount;
use effect_vesting::{cpi::accounts::Open, program::EffectVesting};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [stake_account.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = stake_vault_token_account,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        constraint = reward_account.data_is_empty(),
        seeds = [stake_account.key().as_ref()],
        bump,
        seeds::program = reward_program.key(),
    )]
    pub reward_account: SystemAccount<'info>,

    #[account(
        mut, 
        constraint = vesting_account.data_is_empty()
    )]
    pub vesting_account: Signer<'info>,

    #[account(
        mut,
        seeds = [vesting_account.key().as_ref()],
        bump,
        seeds::program = vesting_program.key(),
        constraint = vesting_account.data_is_empty()
    )]
    pub vesting_vault_token_account: SystemAccount<'info>,

    #[account(
        mut,
        token::authority = authority,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub reward_program: Program<'info, RewardProgram>,

    pub vesting_program: Program<'info, EffectVesting>,

    pub rent: Sysvar<'info, Rent>,

    pub mint: Account<'info, Mint>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {

        require!(
            amount <= self.stake_account.amount,
            StakingErrors::InvalidStakeAccount
        );

        // determine release rate (linear)
        let release_rate = amount / self.stake_account.lock_duration;

        // open a vesting account
        let now: i64 = Clock::get()?.unix_timestamp;
        let start_time = now + UNSTAKE_DELAY_DAYS as i64 * SECONDS_PER_DAY as i64;
      
        open_vesting!(
            self,
            &[&vault_seed!(self.stake_account.key())],
            release_rate,
            start_time,
            false,
            true,
            Some([b'u'])
        )?;

        // transfer tokens from stake vault to the vesting vault
        transfer_tokens_from_vault!(
            self,
            stake_vault_token_account,
            vesting_vault_token_account,
            &[&vault_seed!(self.stake_account.key())],
            amount
        )?;

        // deduct the amount from the stake account
        self.stake_account.amount -= amount;

        Ok(())

    }
}
