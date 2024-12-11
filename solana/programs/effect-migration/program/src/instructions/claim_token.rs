use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use effect_migration_common::{ClaimType, MigrationAccount};

use crate::{errors::MigrationError, utils::verify_claim, vault_seed};

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(
        mut, 
        token::mint = mint,
        token::authority = authority,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub claim_account: Account<'info, MigrationAccount>,

    #[account(mut, token::authority = vault_account, token::mint = mint)]
    pub vault_account: Account<'info, TokenAccount>,

    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClaimToken<'info> {
    fn into_transfer_to_taker_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.recipient_token_account.to_account_info().clone(),
            authority: self.vault_account.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn claim_token(ctx: Context<ClaimToken>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
    // return an error if the claim account is not a token claim account
    if let ClaimType::Stake { .. } = ctx.accounts.claim_account.claim_type {
        return Err(MigrationError::InvalidClaimAccount.into());
    }

    let is_eth = ctx.accounts.claim_account.foreign_public_key.len() == 20;
  
    verify_claim(
        signature,
        message,
        is_eth,
        *ctx.accounts.authority.key,
        ctx.accounts.claim_account.foreign_public_key.clone(),
    )?;
    
    token::transfer(
        ctx.accounts
            .into_transfer_to_taker_context()
            .with_signer(&[&vault_seed!(ctx.accounts.claim_account.key(), *ctx.program_id)[..]]),
        ctx.accounts.vault_account.amount,
    )?;

    Ok(())
}
