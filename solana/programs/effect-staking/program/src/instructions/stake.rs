use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use constants::{STAKE_DURATION_MAX, STAKE_DURATION_MIN, STAKE_MINIMUM_AMOUNT};
use effect_common::cpi;
use effect_staking_common::StakeAccount;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
  
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<StakeAccount>(),
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = stake_vault_token_account,
        seeds = [ stake_account.key().as_ref() ],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Stake<'info> {
    pub fn handler(&mut self, amount: u64, duration: u128) -> Result<()> {
        require!(
            duration >= STAKE_DURATION_MIN,
            StakingErrors::DurationTooShort
        );
        require!(
            duration <= STAKE_DURATION_MAX,
            StakingErrors::DurationTooLong
        );
        require!(
            amount >= STAKE_MINIMUM_AMOUNT,
            StakingErrors::AmountNotEnough
        );

        // get stake account and init stake
        self.stake_account.init(
            amount,
            self.authority.key(),
            duration.try_into().unwrap(),
            Clock::get().unwrap().unix_timestamp
        );

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, stake_vault_token_account, amount)
    }
}
