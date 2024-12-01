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
        space = 8 + std::mem::size_of::<StakeAccount>(),
        seeds = [ b"stake", mint.key().as_ref(), authority.key().as_ref() ],
        bump,
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

    // require claim vault to be signer
    #[account(mut)]
    pub claim_vault: Signer<'info>,

    /// CHECK: checked in ix body
    pub metadata: UncheckedAccount<'info>,

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
        let (vault_authority, _) =
            Pubkey::find_program_address(&[self.metadata.key().as_ref()], &id::MIGRATION_PROGRAM);

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

        require!(amount >= STAKE_MINIMUM_AMOUNT, StakingErrors::AmountNotEnough);

        // get stake account and init stake
        self.stake.init(
            amount,
            self.authority.key(),
            lock_duration.try_into().unwrap(),
            self.vault_token_account.key(),
            stake_start_time,
        );
        
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
