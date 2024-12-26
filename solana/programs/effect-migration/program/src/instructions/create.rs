use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::id::ADMIN_AUTHORITY;
use effect_common::transfer_tokens_to_vault;
use effect_migration_common::MigrationAccount;
use effect_common::cpi;

#[derive(Accounts)]
#[instruction(foreign_address: Vec<u8>)]
pub struct Create<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 4  + foreign_address.len() + 8,
        seeds = [mint.key().as_ref(), &foreign_address.as_slice() ],
        bump
    )]
    pub migration_account: Account<'info, MigrationAccount>,

    #[account(
        init,
        payer = authority, 
        token::mint = mint, 
        token::authority = claim_vault_token_account,
        seeds = [migration_account.key().as_ref()],
        bump
    )]
    pub claim_vault_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut, address = ADMIN_AUTHORITY)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Create>, foreign_address: Vec<u8>, stake_start_time: i64, amount: u64 ) -> Result<()> {
    // initialize the claim account
    ctx.accounts.migration_account.initialize(foreign_address, stake_start_time)?;

    // transfer the tokens to the claim vault
    transfer_tokens_to_vault!(ctx.accounts, claim_vault_token_account, amount)?;

    Ok(())
}
