use core::str;

use crate::{
    errors::CustomError,
    state::MetadataAccount,
    utils::{get_expected_message_bytes, keccak256, sha256},
};

use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use anchor_lang::{
    prelude::*,
    solana_program::{secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey}},
};

use effect_common::constants::SECONDS_PER_DAY;
use effect_staking::{cpi::accounts::GenesisStake, program::EffectStaking};
use sha2::{Digest, Sha256};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(signer)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub metadata_account: Account<'info, MetadataAccount>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,

    /// CHECK: checked in ix body
    #[account(mut)]
    pub stake_account: UncheckedAccount<'info>,

    /// CHECK: checked in ix body
    #[account(mut)]
    pub stake_vault_account: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub staking_program: Program<'info, EffectStaking>,
}

pub fn handler(ctx: Context<Claim>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
    let is_eth = ctx.accounts.metadata_account.foreign_public_key.len() == 20;

    // check if the message matches our expected message
    validate_message(&ctx.accounts.payer.key, &message, is_eth)?;

    // recover and validate the public key from the signature
    let recovered_pubkey = recover_and_validate_pubkey(signature, &message, is_eth)?;

    if recovered_pubkey != ctx.accounts.metadata_account.foreign_public_key {
        msg!("Public Key Mismatch");
        return Err(CustomError::PublicKeyMismatch.into());
    }

    authorize_and_claim(ctx)
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

    return Ok(
        secp256k1_recover(&hashed_message, recovery_id_bytes, signature_bytes)
            .map_err(|e| CustomError::InvalidSignature)?,
    );
}


pub fn authorize_and_claim(ctx: Context<Claim>) -> Result<()> {
    let metadata_account = &ctx.accounts.metadata_account;

    // get the vault authority
    let (_vault_authority, bump) =
        Pubkey::find_program_address(&[metadata_account.key().as_ref()], ctx.program_id);
    let seeds = [
        ctx.accounts.metadata_account.to_account_info().key.as_ref(),
        &[bump],
    ];

    if metadata_account.stake_start_time != 0 {
        effect_staking::cpi::stake_genesis(
            ctx.accounts.into_genesis_stake_context().with_signer(&[&seeds]),
            ctx.accounts.vault_account.amount,
            14 * SECONDS_PER_DAY,
            metadata_account.stake_start_time,
        )?;
    } else {
        // claim all the tokens
        token::transfer(
            ctx.accounts
                .into_transfer_to_taker_context()
                .with_signer(&[&seeds]),
            ctx.accounts.vault_account.amount,
        )?;
    }

    Ok(())
}

pub fn validate_message(payer: &Pubkey, message: &[u8], is_eth: bool) -> Result<()> {
    let expected_message_bytes = get_expected_message_bytes(&payer);

    if is_eth {
        let message_str = str::from_utf8(&message).unwrap();

        // We do a contains check because eth messages are prefixed with additional data.
        if !message_str.contains(str::from_utf8(&expected_message_bytes).unwrap()) {
            return Err(CustomError::MessageInvalid.into());
        }
    } else {
        // For EOS, the message is the serialized transaction located at 108 bytes
        if !message[108..108 + expected_message_bytes.len()].eq(&expected_message_bytes) {
            return Err(CustomError::MessageInvalid.into());
        }
    };

    Ok(())
}

pub fn recover_and_validate_pubkey(sig: Vec<u8>, message: &[u8], is_eth: bool) -> Result<Vec<u8>> {
    let (recovery_id_bytes, signature_bytes) = if is_eth {
        let (sig, rec) = sig.split_at(64);
        (rec, sig)
    } else {
        let (rec, sig) = sig.split_at(1);
        (rec, sig)
    };

    let hashed_message = if is_eth {
        keccak256(message)
    } else {
        sha256(message)
    };

    let recovery_id = recovery_id_bytes[0] - if is_eth { 27 } else { 31 };

    let recovered_pubkey = recover_public_key(signature_bytes, hashed_message, recovery_id)?;

    if is_eth {
        return Ok(keccak256(&recovered_pubkey.to_bytes())[12..32].to_vec());
    }

    // For EOS, append a checksum
    let mut uncompressed_key = vec![0x04];
    uncompressed_key.extend_from_slice(&recovered_pubkey.to_bytes());
    let checksum = &Sha256::digest(&Sha256::digest(&uncompressed_key))[0..4];
    uncompressed_key.extend_from_slice(checksum);

    Ok(uncompressed_key[1..33].to_vec())
}

impl<'info> Claim<'info> {
    fn into_genesis_stake_context(&self) -> CpiContext<'_, '_, '_, 'info, GenesisStake<'info>> {
        let cpi_accounts = GenesisStake {
            mint: self.mint.to_account_info().clone(),
            user_token_account: self.payer_ata.to_account_info().clone(),
            stake: self.stake_account.to_account_info().clone(),
            vault_token_account: self.stake_vault_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
            claim_vault: self.vault_account.to_account_info().clone(),
            metadata: self.metadata_account.to_account_info().clone(),
            system_program: self.system_program.to_account_info().clone(),
            token_program: self.token_program.to_account_info().clone(),
            rent: self.rent.to_account_info().clone(),
        };
        CpiContext::new(self.staking_program.to_account_info().clone(), cpi_accounts)
    }

    fn into_transfer_to_taker_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.payer_ata.to_account_info().clone(),
            authority: self.vault_account.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
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
