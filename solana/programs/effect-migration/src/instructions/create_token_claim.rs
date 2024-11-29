use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer};
use anchor_spl::token::{Mint, Token};

use crate::ClaimTokenAccount;

#[derive(Accounts)]
#[instruction(foreign_public_key: Vec<u8>)]
pub struct CreateTokenClaim<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 32,
        seeds = [
            b"token",
            payer.key().as_ref(),
            mint.key().as_ref(),
            &foreign_public_key.as_slice() 
        ],
        bump 
    )]
    pub claim_account: Account<'info, ClaimTokenAccount>,

    #[account(
        init,
        payer = payer, 
        token::mint = mint, 
        token::authority = payer,
        seeds = [claim_account.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
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

impl<'info> CreateTokenClaim<'info> {
    pub fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.payer_tokens.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    pub fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<CreateTokenClaim>, foreign_public_key: Vec<u8>, amount: u64) -> Result<()> {
    let claim_account = &mut ctx.accounts.claim_account;
    claim_account.foreign_public_key = foreign_public_key; 

    // set the authority of the vault account to the program
    let (vault_authority, _) = Pubkey::find_program_address(
        &[claim_account.to_account_info().key.as_ref()],
        ctx.program_id,
    );

    let _ = token::set_authority(
        ctx.accounts.into_set_authority_context(),
        token::spl_token::instruction::AuthorityType::AccountOwner,
        Some(vault_authority),
    );

    token::transfer(ctx.accounts.into_transfer_to_pda_context(), amount)?;

    Ok(())
}
