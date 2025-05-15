use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::cpi;
use effect_common::id::ADMIN_AUTHORITY;
use effect_common::{close_vault, transfer_tokens_from_vault};

use crate::state::MigrationAccount;
use crate::{id, vault_seed};

#[derive(Accounts)]
pub struct Destroy<'info> {
    #[account(
        mut,
        close = authority,
    )]
    pub migration_account: Account<'info, MigrationAccount>,

    #[account(
        mut,
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
        token::authority = ADMIN_AUTHORITY,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Destroy>) -> Result<()> {
    transfer_tokens_from_vault!(
        ctx.accounts,
        claim_vault_token_account,
        user_token_account,
        &[&vault_seed!(ctx.accounts.migration_account.key(), id())],
        ctx.accounts.claim_vault_token_account.amount
    )?;

    close_vault!(
        ctx.accounts,
        claim_vault_token_account,
        &[&vault_seed!(ctx.accounts.migration_account.key(), id())]
    )?;

    Ok(())
}
