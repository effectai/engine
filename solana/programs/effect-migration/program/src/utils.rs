use core::str;

use sha2::{Digest, Sha256};
use anchor_lang::{prelude::Pubkey, solana_program::keccak};

use anchor_lang::{
    prelude::*,
    solana_program::secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey},
};

use crate::errors::MigrationError;
use crate::state::EXPECTED_MESSAGE;

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
    format!(
        "{}{}", 
        EXPECTED_MESSAGE,
        payer_pubkey
    )
    .into_bytes()
}

pub fn validate_message(payer: &Pubkey, message: &[u8], is_eth: bool) -> Result<()> {
    let expected_message_bytes = get_expected_message_bytes(&payer);

    if is_eth {
        let message_str = str::from_utf8(&message).unwrap();

        // We do a contains check because eth messages are prefixed with additional data.
        if !message_str.contains(str::from_utf8(&expected_message_bytes).unwrap()) {
            return Err(MigrationError::MessageInvalid.into());
        }
        
    } else {
        let mut found = false;
        // look for the expected message in the serialized transaction 
        for i in 0..message.len() - expected_message_bytes.len() {
            if message[i..i + expected_message_bytes.len()].eq(&expected_message_bytes) {
                found = true;
                break;
            }
        }

        if !found {
            return Err(MigrationError::MessageInvalid.into());
        }
    };

    Ok(())
}

pub fn verify_claim(signature: Vec<u8>, message: Vec<u8>, is_eth: bool, payer: Pubkey, foreign_pub_key: Vec<u8>) -> Result<Vec<u8>> {
    // check if the message matches our expected message
    validate_message(&payer, &message, is_eth)?;

    // recover and validate the public key from the signature
    let recovered_pubkey = recover_and_validate_pubkey(signature, &message, is_eth)?;

    if recovered_pubkey != foreign_pub_key {
        return Err(MigrationError::PublicKeyMismatch.into());
    }

    Ok(recovered_pubkey)
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
        return Err(MigrationError::InvalidSignature.into());
    }

    return Ok(
        secp256k1_recover(&hashed_message, recovery_id_bytes, signature_bytes)
            .map_err(|_e| MigrationError::InvalidSignature)?,
    );
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

    // For EOS we append a checksum to the public key
    let mut uncompressed_key = vec![0x04];
    uncompressed_key.extend_from_slice(&recovered_pubkey.to_bytes());
    let checksum = &Sha256::digest(&Sha256::digest(&uncompressed_key))[0..4];
    uncompressed_key.extend_from_slice(checksum);

    // We return the compressed key without the first byte
    Ok(uncompressed_key[1..33].to_vec())
}