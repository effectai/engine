use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::id::REWARDS_PROGRAM;
use effect_vesting::{cpi::accounts::Open, program::EffectVesting};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake.time_unstake == 0 @ StakingErrors::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub vesting_account: Signer<'info>,

    /// CHECK:: checked in ix body
    #[account(mut)]
    pub vesting_account_unchecked: UncheckedAccount<'info>,

    /// CHECK:: checked in ix body
    #[account(mut)]
    pub reward_account: UncheckedAccount<'info>,
    
    /// CHECK:: checked in ix body
    #[account(mut)]
    pub vesting_vault_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub vesting_program: Program<'info, EffectVesting>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // derive reward account
        let (reward_account, _) = Pubkey::find_program_address(&[b"rewards", self.stake.authority.as_ref()],  &REWARDS_PROGRAM);

        // make sure reward account is belonging to this stake account is closed/empty/doesnt exist
        if self.reward_account.key() != reward_account && self.reward_account.data_is_empty() {
            return Err(StakingErrors::InvalidRewardAccount.into());
        }

        // Check if the amount to unstake is less than the total amount staked
        require!(
            amount <= self.stake.amount,
            StakingErrors::InvalidStakeAccount
        );

        // determine release rate (linear)
        let now: i64 = Clock::get()?.unix_timestamp;
        let release_rate = amount / self.stake.duration;

        // open a vesting account
        open_vesting!(self, seeds!(self.stake), release_rate, now, 0, true)?;

        // transfer tokens from stake vault to the vesting vault
        transfer_tokens_from_vault!(self, vesting_vault_account, seeds!(self.stake), amount)?;

        self.stake.amount -= amount;
      
        Ok(())
    }
}
