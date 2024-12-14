use anchor_lang::solana_program::secp256k1_recover::secp256k1_recover;
use anchor_lang::{prelude::Pubkey, solana_program::secp256k1_recover::Secp256k1Pubkey};
use anchor_lang::solana_program::keccak;
use effect_common::ProgramError;
use sha2::{Digest, Sha256};

use crate::{errors::MigrationError, state::EXPECTED_MESSAGE};

pub fn keccak256(message: &[u8]) -> [u8; 32] {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(message);
    let result = hasher.result();
    result.0
}

pub fn sha256(message: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(message);
    let result = hasher.finalize();
    let mut output = [0u8; 32];
    output.copy_from_slice(&result[..]);
    output
}

pub fn get_expected_message_bytes(payer_pubkey: &Pubkey) -> Vec<u8> {
    format!("{}:{}", EXPECTED_MESSAGE, payer_pubkey).into_bytes()
}

pub fn hash_message(message: &[u8], is_eth: bool) -> [u8; 32] {
    if is_eth {
        keccak256(message)
    } else {
        sha256(message)
    }
}

pub fn parse_recovery_id(recovery_id_bytes: &[u8], is_eth: bool) -> u8 {
    let recovery_id = recovery_id_bytes[0];
    recovery_id - if is_eth { 27 } else { 31 }
}

pub fn ethereum_format(pubkey_bytes: &[u8]) -> Vec<u8> {
    let keccak = keccak256(pubkey_bytes);
    keccak[12..32].to_vec()
}

pub fn eos_format(pubkey_bytes: &[u8]) -> Vec<u8> {
    let mut uncompressed_key = vec![0x04];
    uncompressed_key.extend_from_slice(pubkey_bytes);
    let checksum = &sha256(&sha256(&uncompressed_key))[0..4];
    uncompressed_key.extend_from_slice(checksum);
    uncompressed_key[1..33].to_vec()
}

pub fn split_signature(sig: &[u8], is_eth: bool) -> Result<(&[u8], &[u8]), MigrationError> {
    if sig.len() != 65 {
       return Err(MigrationError::InvalidSignature);
    }

    if is_eth {
        let (sig, rec) = sig.split_at(64);
        Ok((rec, sig))
    } else {
        let (rec, sig) = sig.split_at(1);
        Ok((rec, sig))
    }
}

pub fn validate_message(message: &[u8], expected_message_bytes: &[u8]) -> Result<(), MigrationError> {
    if message.windows(expected_message_bytes.len()).any(|window| window == expected_message_bytes) {
        Ok(())
    } else {
        Err(MigrationError::MessageInvalid.into())
    }
}

pub fn recover_public_key(
    signature_bytes: &[u8],
    hashed_message: [u8; 32],
    recovery_id_bytes: u8,
) -> Result<Secp256k1Pubkey, MigrationError> {
    let signature = libsecp256k1::Signature::parse_standard_slice(&signature_bytes)
        .map_err(|_| MigrationError::InvalidSignature)?;

    // check if signature is valid && prevent malleability
    if signature_bytes.len() != 64 || signature.s.is_high() {
        return Err(MigrationError::InvalidSignature);
    }

    return Ok(
        secp256k1_recover(&hashed_message, recovery_id_bytes, signature_bytes)
            .map_err(|_e| MigrationError::InvalidSignature)?,
    );
}