use sha2::{Digest, Sha256};
use anchor_lang::{prelude::Pubkey, solana_program::keccak};

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
        "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: {}",
        payer_pubkey
    )
    .into_bytes()
}