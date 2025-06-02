use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::cpi;
use effect_common::transfer_tokens_from_vault;

use crate::errors::PaymentErrors;
use crate::utils::{change_endianness, u32_to_32_byte_be_array, u64_to_32_byte_be_array};
use crate::{id, vault_seed, PaymentAccount, RecipientManagerDataAccount};

use crate::verifying_key::VERIFYINGKEY;
type G1 = ark_bn254::g1::G1Affine;

use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use groth16_solana::groth16::Groth16Verifier;

pub fn compress_pubkey(pub_x: [u8; 32], pub_y: [u8; 32]) -> Pubkey {
    let mut compressed = pub_y;
    let x_sign = pub_x[0] & 1;
    compressed[31] |= x_sign << 7;
    Pubkey::from(compressed)
}

#[derive(Accounts)]
pub struct ClaimMultiple<'info> {
    #[account()]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut, seeds = [payment_account.key().as_ref()], bump)]
    pub payment_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = authority
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    pub token_program: Program<'info, Token>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProofData {
    min_nonce: u32,
    max_nonce: u32,
    total_amount: u64,
    recipient: [u8; 32],
    proof: [u8; 256],
}

pub fn handler(
    ctx: Context<ClaimMultiple>,
    pub_x: [u8; 32],
    pub_y: [u8; 32],
    proofs: Vec<ProofData>,
) -> Result<()> {
    let mut total_transfer_amount = 0u64;
    let mut last_max_nonce = ctx.accounts.recipient_manager_data_account.nonce;

    let manager_key = compress_pubkey(pub_x, pub_y);
    let expected_seeds = &[ctx.accounts.authority.key.as_ref(), manager_key.as_ref()];
    let (expected_pda, _) = Pubkey::find_program_address(expected_seeds, ctx.program_id);

    // Verify manager PDA
    require_keys_eq!(
        expected_pda,
        ctx.accounts.recipient_manager_data_account.key(),
        PaymentErrors::InvalidPDA
    );

    // Verify manager authorization
    require!(
        ctx.accounts
            .payment_account
            .is_authorized(&manager_key.key()),
        PaymentErrors::Unauthorized
    );

    for proof_data in &proofs {
        // let recipient_pubkey = Pubkey::from(proof_data.recipient);

        //TODO:: Verify recipient matches authority
        // require!(
        //     recipient_pubkey == ctx.accounts.authority.key(),
        //     PaymentErrors::InvalidRecipient
        // );
        //
        // Verify nonce sequence
        require!(
            proof_data.min_nonce > last_max_nonce,
            PaymentErrors::InvalidPayment
        );

        last_max_nonce = proof_data.max_nonce;

        // Unpack and verify proof
        let proof_a: G1 = <G1 as CanonicalDeserialize>::deserialize_uncompressed(
            &*[&change_endianness(&proof_data.proof[0..64])[..], &[0u8][..]].concat(),
        )
        .unwrap();
        let mut proof_a_neg = [0u8; 65];
        <G1 as CanonicalSerialize>::serialize_uncompressed(&-proof_a, &mut proof_a_neg[..])
            .unwrap();
        let proof_a: [u8; 64] = change_endianness(&proof_a_neg[..64]).try_into().unwrap();
        let proof_b: [u8; 128] = proof_data.proof[64..192].try_into().unwrap();
        let proof_c: [u8; 64] = proof_data.proof[192..256].try_into().unwrap();

        let public_inputs = [
            u32_to_32_byte_be_array(proof_data.min_nonce),
            u32_to_32_byte_be_array(proof_data.max_nonce),
            u64_to_32_byte_be_array(proof_data.total_amount),
            proof_data.recipient,
            pub_x,
            pub_y,
        ];

        let mut verifier =
            Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY)
                .unwrap();

        let result = verifier.verify().unwrap();
        require!(result, PaymentErrors::InvalidProof);

        total_transfer_amount = total_transfer_amount
            .checked_add(proof_data.total_amount)
            .ok_or(PaymentErrors::ArithmeticOverflow)?;
    }

    // Update nonce to the last max_nonce in the batch
    ctx.accounts.recipient_manager_data_account.nonce = last_max_nonce;

    // Transfer the total amount of all the proofs.
    if total_transfer_amount > 0 {
        transfer_tokens_from_vault!(
            ctx.accounts,
            payment_vault_token_account,
            recipient_token_account,
            &[&vault_seed!(ctx.accounts.payment_account.key(), id())],
            total_transfer_amount
        )?;
    }

    Ok(())
}
