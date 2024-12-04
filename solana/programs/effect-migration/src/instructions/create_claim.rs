use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use anchor_spl::token::{Mint, Token};
use effect_common::id::AUTHORITY;

use crate::{ClaimAccount, ClaimType};

#[derive(Accounts)]
#[instruction(foreign_public_key: Vec<u8>)]
pub struct CreateClaim<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<ClaimAccount>(),
    )]
    pub claim_account: Account<'info, ClaimAccount>,

    #[account(
        init,
        payer = payer, 
        token::mint = mint, 
        token::authority = vault_account,
        seeds = [claim_account.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, TokenAccount>,

    // CHECK:: is this neccessary?
    // #[account(address = EFFECT_TOKEN @ MigrationError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(mut, address = AUTHORITY)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub payer_tokens: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateClaim<'info> {
    pub fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.payer_tokens.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<CreateClaim>, claim_type: ClaimType, foreign_public_key: Vec<u8>, amount: u64 ) -> Result<()> {
    ctx.accounts.claim_account.initialize(foreign_public_key, claim_type)?;
    token::transfer(ctx.accounts.into_transfer_to_pda_context(), amount)?;
    Ok(())
}
