use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};
use solana_program::ed25519_program::ID as ED25519_ID;
use solana_program::instruction::Instruction;

use crate::errors::PaymentErrors;

pub fn sha256(message: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(message);
    let result = hasher.finalize();
    let mut output = [0u8; 32];
    output.copy_from_slice(&result[..]);
    output
}

pub fn verify_ed25519_ix(
    ix: &Instruction,
    pubkeys: &[&[u8]],
    msgs: &[&[u8]],
    //sigs: &[&[u8]],
) -> Result<()> {
    if ix.program_id != ED25519_ID || ix.accounts.len() != 0 {
        return Err(PaymentErrors::SigVerificationFailed.into());
    }

    let expected_data_len =
        14 + 16 + pubkeys.len() * (64 + 32) + msgs.iter().map(|m| m.len()).sum::<usize>();
    if ix.data.len() != expected_data_len {
        return Err(PaymentErrors::SigVerificationFailed.into());
    }

    check_ed25519_data(&ix.data, pubkeys, msgs)?;

    Ok(())
}

pub fn check_ed25519_data(
    data: &[u8],
    pubkeys: &[&[u8]],
    msgs: &[&[u8]],
    //sigs: &[&[u8]],
) -> Result<()> {
    if pubkeys.len() != msgs.len() {
        return Err(PaymentErrors::SigVerificationFailed.into());
    }

    let num_signatures = data[0];
    if num_signatures as usize != pubkeys.len() {
        return Err(PaymentErrors::SigVerificationFailed.into());
    }

    let mut offset = 1 + 1;
    for i in 0..num_signatures as usize {
        let signature_offset = u16::from_le_bytes([data[offset], data[offset + 1]]) as usize;
        let signature_instruction_index = u16::from_le_bytes([data[offset + 2], data[offset + 3]]);
        let public_key_offset = u16::from_le_bytes([data[offset + 4], data[offset + 5]]) as usize;
        let public_key_instruction_index = u16::from_le_bytes([data[offset + 6], data[offset + 7]]);
        let message_data_offset = u16::from_le_bytes([data[offset + 8], data[offset + 9]]) as usize;
        let message_data_size = u16::from_le_bytes([data[offset + 10], data[offset + 11]]) as usize;
        let message_instruction_index = u16::from_le_bytes([data[offset + 12], data[offset + 13]]);

        let exp_message_data_size = msgs[i].len();

        if signature_instruction_index != u16::MAX
            || public_key_instruction_index != u16::MAX
            || message_instruction_index != u16::MAX
            || message_data_size != exp_message_data_size
        {
            return Err(PaymentErrors::SigVerificationFailed.into());
        }

        let data_pubkey = &data[public_key_offset..public_key_offset + 32];
        //TODO:: do we also have to check for signature matching ??
        //let data_sig = &data[signature_offset..signature_offset + 64];
        let data_msg = &data[message_data_offset..message_data_offset + message_data_size];

        if data_pubkey != pubkeys[i] || data_msg != msgs[i] {
            return Err(PaymentErrors::SigVerificationFailed.into());
        }

        offset += 14;
    }

    Ok(())
}
