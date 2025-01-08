use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi::transfer_tokens;
use effect_migration_common::{MigrationAccount, MigrationProgram};
use effect_staking_common::StakeAccount;

#[derive(Accounts)]
pub struct GenesisStake<'info> {
    #[account()]
    pub authority: Signer<'info>,

    #[account()]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut, 
        token::mint = mint,
        token::authority = authority,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        mut, 
        token::mint = mint,
        token::authority = stake_vault_token_account,
        seeds = [ stake_account.key().as_ref() ],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub migration_account: Account<'info, MigrationAccount>,

    #[account(
        signer,
        mut, 
        seeds = [migration_account.key().as_ref()],
        bump,
        seeds::program = migration_program.key(),
        token::mint = mint,
        token::authority = migration_vault_token_account,
    )]
    pub migration_vault_token_account: Account<'info, TokenAccount>,

    pub migration_program: Program<'info, MigrationProgram>,

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

        // We always do a topup here, as to only allow already initialized stakes.
        self.stake_account.topup(amount, stake_start_time);
      
        // Transfer tokens from claim vault to the stake vault
        transfer_tokens(
            self.token_program.to_account_info(),
            self.migration_vault_token_account.to_account_info(),
            self.stake_vault_token_account.to_account_info(),
            self.migration_vault_token_account.to_account_info(),
            &[],
            amount,
        )
    }
}
