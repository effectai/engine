use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::cpi;
use effect_common::transfer_tokens_from_vault;
use effect_payment_common::{Payment, PaymentAccount, RecipientManagerDataAccount};
use solana_program::instruction::Instruction;

use crate::errors::PaymentErrors;
use crate::utils::{change_endianness, u32_to_32_byte_be_array, u64_to_32_byte_be_array};
use crate::{id, vault_seed};

use crate::verifying_key::VERIFYINGKEY;
type G1 = ark_bn254::g1::G1Affine;

use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use groth16_solana::groth16::Groth16Verifier;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account()]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut, seeds = [payment_account.key().as_ref()], bump) ]
    pub payment_vault_token_account: Account<'info, TokenAccount>,

    //TODO:: ata of authority
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    pub token_program: Program<'info, Token>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<Claim>,
    min_nonce: u32,
    max_nonce: u32,
    total_amount: u64,
    pub_x: [u8; 32],
    pub_y: [u8; 32],
    proof: [u8; 256],
) -> Result<()> {
    //make sure manager key is part of authorities on the payment account
    let manager_key = Pubkey::from(pub_x);
    require!(
        ctx.accounts
            .payment_account
            .is_authorized(&manager_key.key()),
        PaymentErrors::Unauthorized
    );

    let last_nonce = ctx.accounts.recipient_manager_data_account.nonce;
    require!(min_nonce > last_nonce, PaymentErrors::InvalidPayment);

    // unpack the snark proof components
    let proof_a: G1 = <G1 as CanonicalDeserialize>::deserialize_uncompressed(
        &*[&change_endianness(&proof[0..64])[..], &[0u8][..]].concat(),
    )
    .unwrap();
    let mut proof_a_neg = [0u8; 65];
    <G1 as CanonicalSerialize>::serialize_uncompressed(&-proof_a, &mut proof_a_neg[..]).unwrap();
    let proof_a: [u8; 64] = change_endianness(&proof_a_neg[..64]).try_into().unwrap();
    let proof_b: [u8; 128] = proof[64..192].try_into().unwrap();
    let proof_c: [u8; 64] = proof[192..256].try_into().unwrap();

    let public_inputs = [
        u32_to_32_byte_be_array(min_nonce),
        u32_to_32_byte_be_array(max_nonce),
        u64_to_32_byte_be_array(total_amount),
        pub_x,
        pub_y,
    ];

    // verify the proof is correct
    let mut verifier =
        Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY).unwrap();

    let result = verifier.verify().unwrap();
    require!(result == true, PaymentErrors::InvalidProof);

    // update the nonce
    ctx.accounts.recipient_manager_data_account.nonce = max_nonce;

    // transfer the tokens to the recipient
    transfer_tokens_from_vault!(
        ctx.accounts,
        payment_vault_token_account,
        recipient_token_account,
        &[&vault_seed!(ctx.accounts.payment_account.key(), id())],
        total_amount
    )?;

    Ok(())
}
