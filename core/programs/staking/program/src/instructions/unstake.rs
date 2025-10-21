use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use constants::UNSTAKE_DELAY_DAYS;
use effect_common::cpi;
use effect_common::constants::SECONDS_PER_DAY;

use effect_reward::program::EffectReward;
use effect_vesting::program::EffectVesting;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake_account.scope == mint.key() @ StakingErrors::InvalidStakeAccount,
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
        constraint = reward_account.data_is_empty() @ StakingErrors::InvalidRewardAccount,
        seeds = [stake_account.key().as_ref()],
        bump,
        seeds::program = reward_program.key(),
    )]
    pub reward_account: SystemAccount<'info>,

    #[account(
        signer,
        mut, 
        constraint = vesting_account.data_is_empty() @ StakingErrors::InvalidVestingAccount,
    )]
    pub vesting_account: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [vesting_account.key().as_ref()],
        bump,
        seeds::program = vesting_program.key(),
    )]
    pub vesting_vault_token_account: SystemAccount<'info>,

    #[account(
        mut,
        token::authority = authority,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub reward_program: Program<'info, EffectReward>,
    pub vesting_program: Program<'info, EffectVesting>,
    pub rent: Sysvar<'info, Rent>,
    pub mint: Account<'info, Mint>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // if lock_duration is 0, unstaking is not allowed
        require!(
            self.stake_account.lock_duration > 0,
            StakingErrors::NotAllowedToUnstake
        );

        require!(
            amount <= self.stake_account.amount,
            StakingErrors::InvalidStakeAccount
        );

        // determine release rate (linear)
        let release_rate = amount / self.stake_account.lock_duration;

        let mint_info = &self.mint;
        let decimals = mint_info.decimals;

        let min_release_rate = 1 * 10u64.pow((decimals as u32).saturating_sub(decimals as u32)); 
        require!(release_rate >= min_release_rate, StakingErrors::ReleaseRateTooLow);

        // open a vesting account
        let now: i64 = Clock::get()?.unix_timestamp;
        let start_time = now + UNSTAKE_DELAY_DAYS as i64 * SECONDS_PER_DAY as i64;
      
        open_vesting!(
            self,
            &[&vault_seed!(self.stake_account.key())],
            release_rate,
            start_time,
            false,
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
        self.stake_account.unstake(amount)?;

        Ok(())

    }
}
