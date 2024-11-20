use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = StakeAccount::SIZE,
        seeds = [ b"stake", mint.key().as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub stake: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ stake.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Stake<'info> {
    pub fn handler(&mut self, amount: u64, duration: u128, vault_bump: u8) -> Result<()> {
        // test duration and amount
        require!(
            duration >= StakeAccount::DURATION_MIN,
            EffectStakingError::DurationTooShort
        );
        require!(
            duration <= StakeAccount::DURATION_MAX,
            EffectStakingError::DurationTooLong
        );
        require!(
            amount >= StakeAccount::STAKE_MINIMUM,
            EffectStakingError::AmountNotEnough
        );

        // get stake account and init stake
        self.stake.init(
            amount,
            self.authority.key(),
            duration.try_into().unwrap(),
            self.vault.key(),
            vault_bump,
        );

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, amount)
    }
}
