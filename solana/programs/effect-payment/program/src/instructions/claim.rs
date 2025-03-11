use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::cpi;
use effect_common::transfer_tokens_from_vault;
use effect_payment_common::{Payment, PaymentAccount, RecipientPaymentDataAccount};
use solana_program::instruction::Instruction;

use crate::errors::PaymentErrors;
use crate::{id, vault_seed};

use crate::verifying_key::{VERIFYINGKEY};
type G1 = ark_bn254::g1::G1Affine;

use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use groth16_solana::groth16::Groth16Verifier;

#[derive(Accounts)]
pub struct Claim<'info> {
    // #[account()]
    // pub payment_account: Account<'info, PaymentAccount>,

    // #[account(mut, seeds = [payment_account.key().as_ref()], bump) ]
    // pub payment_vault_token_account: Account<'info, TokenAccount>,

    // #[account()]
    // pub recipient_token_account: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub recipient_payment_data_account: Account<'info, RecipientPaymentDataAccount>,

    // pub token_program: Program<'info, Token>,

    pub mint: Account<'info, Mint>,

    // #[account(mut)]
    // pub authority: Signer<'info>,
}

fn serialize_payment_message(payment: &Payment) -> Result<Vec<u8>> {
    let mut message = Vec::new();

    message.extend_from_slice(&payment.id);
    message.extend_from_slice(&payment.amount.to_le_bytes());
    message.extend_from_slice(payment.recipient_token_account.as_ref());
    message.extend_from_slice(&payment.nonce.to_le_bytes());

    Ok(message)
}

pub fn handler(
    ctx: Context<Claim>,
    min_nonce: u64,
    max_nonce: u64,
    total_amount: u64,
    pub_x: [u8; 32],
    pub_y: [u8; 32],
    proof: [u8; 256]
    // authority: Pubkey
) -> Result<()> {
    // let mut highest_nonce = ctx.accounts.recipient_payment_data_account.nonce;

    // unpack the snark proof components
    let proof_a: G1 = <G1 as CanonicalDeserialize>::deserialize_uncompressed(
	&*[&change_endianness(&proof[0..64])[..], &[0u8][..]].concat(),
    )
	.unwrap();
    let mut proof_a_neg = [0u8; 65];
    <G1 as CanonicalSerialize>::serialize_uncompressed(&-proof_a, &mut proof_a_neg[..])
	.unwrap();
    let proof_a: [u8; 64] = change_endianness(&proof_a_neg[..64]).try_into().unwrap();
    let proof_b: [u8; 128] = proof[64..192].try_into().unwrap();
    let proof_c: [u8; 64] = proof[192..256].try_into().unwrap();

    let public_inputs = [
	u64_to_32_byte_be_array(min_nonce),
	u64_to_32_byte_be_array(max_nonce),
	u64_to_32_byte_be_array(total_amount),
	pub_x,
	pub_y
    ];

    // verify the proof is correct
    let mut verifier =
	Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY)
	.unwrap();

    let result = verifier.verify().unwrap();


    Ok(())

    // update the nonce
    // ctx.accounts.recipient_payment_data_account.nonce = highest_nonce;

    // transfer the tokens to the recipient
    // transfer_tokens_from_vault!(
    //     ctx.accounts,
    //     payment_vault_token_account,
    //     recipient_token_account,
    //     &[&vault_seed!(ctx.accounts.payment_account.key(), id())],
    //     total_amount
    // )?;

    // require!(
    //	result == Ok(true),
    //	PaymentErrors::SigVerificationFailed
    // );

}

fn u64_to_32_byte_be_array(value: u64) -> [u8; 32] {
    let mut result = [0u8; 32];
    let value_bytes = value.to_be_bytes();
    result[24..].copy_from_slice(&value_bytes);
    result
}

fn change_endianness(bytes: &[u8]) -> Vec<u8> {
    let mut vec = Vec::new();
    for b in bytes.chunks(32) {
	for byte in b.iter().rev() {
	    vec.push(*byte);
	}
    }
    vec
}
