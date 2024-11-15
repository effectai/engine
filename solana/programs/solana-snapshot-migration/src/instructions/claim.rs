use core::str;

use crate::{errors::CustomError, state::MetadataAccount};

use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use anchor_lang::{
    prelude::*,
    solana_program::{
        keccak,
        secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey},
    },
};

use sha2::{Digest, Sha256};
use tiny_keccak::{Hasher, Keccak};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(signer)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub recipient_tokens: Account<'info, TokenAccount>,

    #[account(mut)]
    pub metadata_account: Account<'info, MetadataAccount>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    fn into_transfer_to_taker_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.recipient_tokens.to_account_info().clone(),
            authority: self.vault_account.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8>, is_eth: bool) -> Result<()> {
    let message_str = str::from_utf8(&message).unwrap();

    if !message_str.contains("Effect.AI: Sign this message to prove ownership of your address.") {
        msg!("Invalid message");
        return Err(CustomError::MessageInvalid.into());
    }

    let metadata_account = &ctx.accounts.metadata_account;
    let (metadata, _bump) = Pubkey::find_program_address(
        &[ctx.accounts.payer.key.as_ref(), metadata_account.foreign_public_key.as_ref()],
        ctx.program_id,
    );

    if metadata != metadata_account.key() {
        msg!("Invalid metadata account");
        return Err(CustomError::InvalidMetadataAccount.into());
    }

    let recovered_public_key = recover_pubkey(&sig, &message, is_eth)?;

    let uncompressed_public_key = recovered_public_key.0;

    // returns the public key to the original format (in bytes)
    let recovered_public_key_parsed =
        parse_recovered_uncompressed_public_key(is_eth, &uncompressed_public_key);

    msg!("Recovered Public Key: {:?}", recovered_public_key_parsed);
    msg!(
        "Foreign Public Key in Metadata Account: {:?}",
        metadata_account.foreign_public_key,
    );

    // check if first 32 bytes of the recovered public key matches the foreign public key in the vaultAccount metadata
    if recovered_public_key_parsed != metadata_account.foreign_public_key {
        msg!("Public Key Mismatch");
        return Err(CustomError::PublicKeyMismatch.into());
    }

    let (_vault_authority, bump) =
        Pubkey::find_program_address(&[metadata_account.key().as_ref()], ctx.program_id);
    let seeds = [
        ctx.accounts.metadata_account.to_account_info().key.as_ref(),
        &[bump],
    ];

    // claim all the tokens
    token::transfer(
        ctx.accounts
            .into_transfer_to_taker_context()
            .with_signer(&[&seeds]),
        ctx.accounts.vault_account.amount,
    )?;

    Ok(())
}

fn recover_pubkey(signature: &[u8], message: &[u8], is_eth: bool) -> Result<Secp256k1Pubkey> {
    
    let (recovery_id_bytes, signature_bytes) = if is_eth {
        // Ethereum: Recovery ID is the last byte, signature is the first 64 bytes
        let (sig_bytes, rec_id) = signature.split_at(signature.len() - 1);
        (rec_id, sig_bytes)
    } else {
        // EOS: Recovery ID is the first byte, signature is the remaining 64 bytes
        let (rec_id, sig_bytes) = signature.split_at(1);
        (rec_id, sig_bytes)
    };

    let signature = libsecp256k1::Signature::parse_standard_slice(&signature_bytes)
        .map_err(|_| ProgramError::InvalidArgument)?;

    // check if signature is valid && prevent malleability
    if signature_bytes.len() != 64 || signature.s.is_high() {
        msg!("Error: Invalid signature length");
        return Err(CustomError::InvalidSignature.into());
    }

    let hashed_message = if is_eth {
        keccak256(message)
    } else {
        sha256(message)
    };

    let recovery_id_adjusted = match recovery_id_bytes.get(0) {
        Some(&id) => {
            let adjustment = if is_eth { 27 } else { 31 };
            id.checked_sub(adjustment)
                .ok_or(CustomError::InvalidRecoveryId)?
        }
        None => {
            msg!("Error: Recovery ID byte missing from the signature");
            return Err(CustomError::InvalidSignature.into());
        }
    };

    // handle result
    secp256k1_recover(&hashed_message, recovery_id_adjusted, signature_bytes).map_err(|e| {
        CustomError::InvalidSignature.into()
    })
}

fn parse_recovered_uncompressed_public_key(
    is_eth: bool,
    uncompressed_public_key: &[u8],
) -> Vec<u8> {
    let recovered_public_key_parsed = if is_eth {
        let hashed_public_key = keccak256(uncompressed_public_key);
        hashed_public_key[12..32].to_vec()
    } else {
        uncompressed_public_key[0..32].to_vec()
    };

    recovered_public_key_parsed
}

fn keccak256(message: &[u8]) -> [u8; 32] {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(message);
    let result = hasher.result();
    result.0
}

fn sha256(message: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(message);
    let result = hasher.finalize();
    let mut output = [0u8; 32];
    output.copy_from_slice(&result[..]);
    output
}
