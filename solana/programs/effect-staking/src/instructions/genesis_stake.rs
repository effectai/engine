use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use constants::{STAKE_DURATION_MAX, STAKE_DURATION_MIN, STAKE_MINIMUM_AMOUNT};
use effect_common::cpi::{self, transfer_tokens};

#[derive(Accounts)]
pub struct GenesisStake<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<StakeAccount>()
    )]
    pub stake: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault_token_account,
        seeds = [ stake.key().as_ref() ],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub claim_vault: Signer<'info>,

    /// CHECK: checked in ix body
    #[account(mut)]
    pub claim_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> GenesisStake<'info> {
    pub fn handler(
        &mut self,
        amount: u64,
        lock_duration: u128,
        stake_start_time: i64,
    ) -> Result<()> {
        let (vault_authority, _) = Pubkey::find_program_address(
            &[self.claim_account.key().as_ref()],
            &id::MIGRATION_PROGRAM,
        );

        // Check if the claim_vault (signer) PDA is the same as the derived vault authority
        require_eq!(
            vault_authority,
            self.claim_vault.key(),
            StakingErrors::VaultAuthorityMismatch
        );

        require!(
            lock_duration >= STAKE_DURATION_MIN,
            StakingErrors::DurationTooShort
        );

        require!(
            lock_duration <= STAKE_DURATION_MAX,
            StakingErrors::DurationTooLong
        );

        require!(
            amount >= STAKE_MINIMUM_AMOUNT,
            StakingErrors::AmountNotEnough
        );

        // check if stake account already exists
        if self.stake.to_account_info().data_is_empty() {
            // if stake does not exist, we init the account.
            self.stake.init(
                amount,
                self.authority.key(),
                lock_duration.try_into().unwrap(),
                self.vault_token_account.key(),
                stake_start_time,
            );
        } else {
            // if stake already exists, we do a topup
            self.stake.topup(amount, stake_start_time);
        }

        // transfer tokens from claim vault to the stake vault
        transfer_tokens(
            self.token_program.to_account_info(),
            self.claim_vault.to_account_info(),
            self.vault_token_account.to_account_info(),
            self.claim_vault.to_account_info(),
            &[],
            amount,
        )
    }
}
