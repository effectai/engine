use core::str;

use crate::{errors::CustomError, state::MetadataAccount};

use anchor_spl::{token::{self, Token, TokenAccount, Transfer}};

use anchor_lang::{
    prelude::*,
    solana_program::{keccak, secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey}},
};

use sha2::{Sha256, Digest};
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

pub fn handler(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8>, is_eth: bool) -> Result<()> {
    let message_str = str::from_utf8(&message).unwrap();
    if !message_str.contains("Effect.AI: Sign this message to prove ownership of your address.") {
        msg!("Invalid message");
        return Err(CustomError::MessageInvalid.into());
    }
    
    let recovered_public_key = recover_pubkey(&sig, &message, is_eth)
        .map_err(|e| {
            msg!("Error: {:?}", e);
            e
        })?;

    let metadata_account = &ctx.accounts.metadata_account;
    let uncompressed_public_key = recovered_public_key.0;
  
    // returns the public key to the original format (in bytes)
    let recovered_public_key_parsed = parse_recovered_uncompressed_public_key(is_eth, &uncompressed_public_key);

    // check if first 32 bytes of the recovered public key matches the foreign public key in the vaultAccount metadata
    if recovered_public_key_parsed != metadata_account.foreign_public_key {
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

fn recover_pubkey(signature: &[u8], message: &[u8], is_eth: bool) -> Result<Secp256k1Pubkey> {
    let (recovery_id, signature) = match is_eth {
        true => {
            //  ethereum has recovery_id in the last byte
            let (signature, recovery_id) = signature.split_at(signature.len() - 1);
            (recovery_id, signature)
        },
        false => {
            // EOS has recovery_id in the first byte
            let (recovery_id, signature ) = signature.split_at(1);
            (recovery_id, signature)
        }
    };

    if signature.len() != 64 {
        msg!("Error: Invalid signature length");
        return Err(CustomError::InvalidSignature.into());
    }

    let hashed_message = match is_eth {
        true => {
            keccak256(&message)
        },
        false => {
            sha256(&message)
        }
    };

    let recovery_id_adjusted = match is_eth {
        true => {
            recovery_id[0] - 27
        },
        false => {
            recovery_id[0] - 31
        }
    };

    // handle result
    match secp256k1_recover(
        &hashed_message,
        recovery_id_adjusted,
        &signature,
    ) {
        Ok(pub_key) => {
            Ok(pub_key)
        },
        Err(e) => {
            msg!("Error: {:?}", e);
            Err(CustomError::InvalidSignature.into())
        }
    }
}

fn parse_recovered_uncompressed_public_key(is_eth: bool, uncompressed_public_key: &[u8]) -> Vec<u8> {
    let recovered_public_key_parsed = if is_eth {
        let hashed_public_key = keccak256(uncompressed_public_key);
        hashed_public_key[12..32].to_vec()  
    } else {
        uncompressed_public_key[1..34].to_vec()
    };

    recovered_public_key_parsed
}

fn keccak256(message: &[u8]) -> [u8; 32] {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(message);
    let result  = hasher.result();
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