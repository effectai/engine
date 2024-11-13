use core::str;
use anchor_spl::{associated_token::AssociatedToken, token::{self, Mint, Token, TokenAccount, Transfer, SetAuthority}};

use anchor_lang::{
    prelude::*,
    solana_program::{secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey}},
};

declare_id!("5su2b4QEeM8TWtH9XeEwRDLH95mNkgRhLZ1hfhkntJdW");

/// CHECK:
#[program]
pub mod solana_snapshot_migration {
    use super::*;

    pub fn initialize(ctx: Context<InitializeAndDeposit>, foreign_public_key: Vec<u8>, amount: u64) -> Result<()> {
        let metadata_account = &mut ctx.accounts.metadata;
        metadata_account.foreign_public_key = foreign_public_key; // Store the EOS/BSC public key as bytes
     
        msg!("Foreign Public Key: {:?}", metadata_account.foreign_public_key);

        let (vault_authority, _) = Pubkey::find_program_address(&[metadata_account.to_account_info().key.as_ref()], ctx.program_id);

        let _ = token::set_authority(
            ctx.accounts.into_set_authority_context(),
            token::spl_token::instruction::AuthorityType::AccountOwner,
            Some(vault_authority),
        );

        token::transfer(
            ctx.accounts.into_transfer_to_pda_context(),
            amount,
        )?;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
        let recovered_public_key = recover_pubkey(&sig, &message)
            .map_err(|e| {
                msg!("Error: {:?}", e);
                e
            })?;

        let metadata_account = &ctx.accounts.metadata_account;

        // check if first 32 bytes of the recovered public key matches the foreign public key in the vaultAccount metadata
        if recovered_public_key.0[..32] != metadata_account.foreign_public_key[1..].to_vec() {
            msg!("Public Key Mismatch");
            return Err(CustomError::PublicKeyMismatch.into());
        }

        let (_vault_authority, bump) = Pubkey::find_program_address(&[metadata_account.key().as_ref()], ctx.program_id);
        let seeds = [ctx.accounts.metadata_account.to_account_info().key.as_ref(), &[bump]];

        // claim all the tokens
        token::transfer(
            ctx.accounts.into_transfer_to_taker_context().with_signer(&[&seeds]),
            ctx.accounts.vault_account.amount,
        )?;
        
        Ok(())
    }
}

impl<'info> Claim<'info> {
    fn into_transfer_to_taker_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .vault_account
                .to_account_info()
                .clone(),
            to: self.recipient_tokens.to_account_info().clone(),
            authority: self.vault_account.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

impl<'info> InitializeAndDeposit<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.payer_tokens.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[account]
pub struct MetadataAccount {
    pub foreign_public_key: Vec<u8>,
}

#[derive(Accounts)]
pub struct InitializeAndDeposit<'info> {
    #[account(
        init,
        payer = payer,
        space = 64 , 
        // + 32 bytes for the public key
    )]
    pub metadata: Account<'info, MetadataAccount>,

    #[account(
        init,
        payer = payer, 
        token::mint = mint, 
        token::authority = payer,
        seeds = [metadata.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_tokens: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(signer)]
    pub payer: Signer<'info>,

    /// CHECK:
    #[account(mut)]
    pub recipient_tokens: Account<'info, TokenAccount>,

    #[account(mut)]
    pub metadata_account: Account<'info, MetadataAccount>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// Custom Error
#[error_code]
pub enum CustomError {
    #[msg("Invalid signature provided.")]
    InvalidSignature,

    #[msg("Public key does not match the foreign public key.")]
    PublicKeyMismatch,
}

fn recover_pubkey(signature: &[u8], message: &[u8]) -> Result<Secp256k1Pubkey> {
    // extract the recovery id from the signature (first byte)
    let (recovery_id, signature) = signature.split_at(1);

    // TODO:: check signature length which should be 65 bytes
    // TODO:: preferably we hash the message on the contract side to prevent malleability

    let public_key = secp256k1_recover(
        &message,
        //TODO:: eos adds 31 to the recovery id, eth adds 27 (?)..
        recovery_id[0] - 31, 
        &signature,
    );

    // handle result
    match public_key {
        Ok(pub_key) => {
            Ok(pub_key)
        }
        Err(e) => {
            // debug
            msg!("Error: {:?}", e);
            Err(CustomError::InvalidSignature.into())
        }
    }
}
