use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi::transfer_tokens;

#[derive(Accounts)]
pub struct GenesisStake<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut, 
        token::mint = mint,
        token::authority = authority,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut, 
        has_one = vault_token_account @ StakingErrors::InvalidVault,
        has_one = authority @ StakingErrors::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
    
    #[account(mut, 
        token::mint = mint,
        token::authority = vault_token_account,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

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

        // We always do a topup here, as to only allow already initialized stakes.
        self.stake.topup(amount, stake_start_time);
      
        // Transfer tokens from claim vault to the stake vault
        transfer_tokens(
            self.token_program.to_account_info(),
            self.claim_vault.to_account_info(),
            self.vault_token_account.to_account_info(),
            self.claim_vault.to_account_info(),
            &[&vault_seed!(self.stake.key())],
            amount,
        )
    }
}
