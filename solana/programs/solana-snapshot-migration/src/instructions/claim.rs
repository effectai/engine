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

pub fn unlock_eth(ctx: Context<Claim>, sig: Vec<u8>, message: Vec<u8>) -> Result<()> {
    let message_str = str::from_utf8(&message).unwrap();

    if !message_str.contains(&format!(
        "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: {}",
        ctx.accounts.payer.key().to_string()
    )) {
        msg!("Invalid message");
        return Err(CustomError::MessageInvalid.into());
    }

    let (signature_bytes, recovery_id_bytes) = sig.split_at(64);

    let recovered_public_key = recover_public_key(
        signature_bytes,
        keccak256(&message),
        recovery_id_bytes[0] - 27,
    )?;

    let hashed_public_key = keccak256(&recovered_public_key.0)[12..32].to_vec();

    authorize_and_claim(ctx, hashed_public_key.to_vec())?;

    Ok(())
}

pub fn unlock_eos(
    ctx: Context<Claim>,
    sig: Vec<u8>,
    serialized_tx_bytes: Vec<u8>,
) -> Result<()> {

    let message_to_verify = &format!(
        "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: {}",
        ctx.accounts.payer.key().to_string()
    );

    // convert to bytes
    let message_bytes = message_to_verify.as_bytes();

    // check if the message is part of the serialized tx bytes
    // the message starts at 108 bytes in the serialized tx bytes
    if serialized_tx_bytes[108..108 + message_bytes.len()] != *message_bytes {
        return Err(CustomError::MessageInvalid.into());
    }

    // hash the serialized transaction (this is our message)
    let signing_digest = sha256(&serialized_tx_bytes);
    let (recovery_id_bytes, signature_bytes) = sig.split_at(1);
    let recovered_pubkey = recover_public_key(signature_bytes, signing_digest, recovery_id_bytes[0] - 31)?;
    
    // convert recovered secp256k1 to EOS public key format
    let mut uncompressed_key = Vec::with_capacity(65);
    uncompressed_key.push(0x04); // Prefix for uncompressed public key
    uncompressed_key.extend_from_slice(&recovered_pubkey.to_bytes());
 
    let hash = Sha256::digest(&uncompressed_key);
    let double_hash = Sha256::digest(hash);
    let checksum = &double_hash[0..4]; // checksum = first 4 bytes of the double hash
 
    let mut eos_key_with_checksum = uncompressed_key.clone();
    eos_key_with_checksum.extend_from_slice(checksum);
    
    authorize_and_claim(ctx, eos_key_with_checksum[1..33].to_vec())?;
    
    Ok(())
}

pub fn recover_public_key(
    signature_bytes: &[u8],
    hashed_message: [u8; 32],
    recovery_id_bytes: u8,
) -> Result<Secp256k1Pubkey> {
    let signature = libsecp256k1::Signature::parse_standard_slice(&signature_bytes)
        .map_err(|_| ProgramError::InvalidArgument)?;

    // check if signature is valid && prevent malleability
    if signature_bytes.len() != 64 || signature.s.is_high() {
        msg!("Error: Invalid signature length");
        return Err(CustomError::InvalidSignature.into());
    }
    
    return Ok(secp256k1_recover(&hashed_message, recovery_id_bytes, signature_bytes)
            .map_err(|e| CustomError::InvalidSignature)?);

}
pub fn unlock_vault(ctx: Context<Claim>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
    let foreign_public_key = &ctx.accounts.metadata_account.foreign_public_key;

    msg!("Initializing Claim Process...");

    if foreign_public_key.len() == 20 {
        unlock_eth(ctx, signature, message)
    } else {
        unlock_eos(ctx, signature, message)
    }

}

pub fn authorize_and_claim(ctx: Context<Claim>, recovered_public_key: Vec<u8>) -> Result<()>  {
    let metadata_account = &ctx.accounts.metadata_account;

    if recovered_public_key != metadata_account.foreign_public_key {
        msg!("Public Key Mismatch");
        return Err(CustomError::PublicKeyMismatch.into());
    }

    let (_vault_authority, bump) =
        Pubkey::find_program_address(&[metadata_account.key().as_ref()], ctx.program_id);
    let seeds = [
        ctx.accounts.metadata_account.to_account_info().key.as_ref(),
        &[bump],
    ];

    msg!("Claiming Tokens...");

    // claim all the tokens
    token::transfer(
        ctx.accounts
            .into_transfer_to_taker_context()
            .with_signer(&[&seeds]),
        ctx.accounts.vault_account.amount,
    )?;

    msg!("Tokens Claimed Successfully");

    Ok(())
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

#[error_code]
pub enum ErrorCode {
    #[msg("The memo in the transaction does not match the expected value.")]
    MemoMismatch,
    #[msg("The recovered public key does not match the expected public key.")]
    PublicKeyMismatch,
    #[msg("Invalid signature provided.")]
    InvalidSignature,
    #[msg("Invalid transaction message.")]
    InvalidMessage,
    #[msg("Invalid actions provided.")]
    InvalidActions,
    #[msg("Memo field not found in actions.")]
    MemoNotFound,
}
