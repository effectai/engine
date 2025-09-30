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
use num_bigint::{BigInt, Sign};

/* Function for compressing (packing) 2 public key coordinates (x, y) into a single 32-byte array.
 * The compression is done by taking the x coordinate and the y coordinate,
 * and encoding them in a specific way to fit into 32 bytes;
*  For more information, see: https://github.com/iden3/circomlibjs/blob/4f094c5be05c1f0210924a3ab204d8fd8da69f49/src/babyjub.js#L97
 */
/// Q = babyjubjub field modulus
const Q_HEX: &str = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
pub fn compress(pub_x: [u8; 32], pub_y: [u8; 32]) -> [u8; 32] {
    let x_big = BigInt::from_bytes_be(Sign::Plus, &pub_x);
    let y_big = BigInt::from_bytes_be(Sign::Plus, &pub_y);

    let (_, mut y_le) = y_big.to_bytes_le();
    y_le.resize(32, 0);

    y_le[31] &= 0x7F;

    let q = BigInt::parse_bytes(Q_HEX.as_bytes(), 16).unwrap();
    let q_half = &q >> 1;

    if x_big > q_half {
        y_le[31] |= 0x80;
    }

    y_le.try_into().unwrap()
}

/*
* For identity purposes, we truncate some public keys by shifting it right by 3 bits.
* This is done due to a mismatch in the proof generation and public key size (254 bits vs 256).
*/
pub fn public_key_to_truncated_hex(bytes: [u8; 32]) -> [u8; 32] {
    let mut big = num_bigint::BigUint::from_bytes_be(&bytes);

    // Shift right by 3 bits
    big >>= 3;

    let hex_str = format!("{:0>64x}", big);

    let mut hex_bytes = [0u8; 32];
    for (i, byte) in hex_str.as_bytes().chunks(2).enumerate() {
        if let Ok(value) = u8::from_str_radix(std::str::from_utf8(byte).unwrap(), 16) {
            hex_bytes[i] = value;
        }
    }

    hex_bytes
}

#[derive(Accounts)]
pub struct Claim<'info> {
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

pub fn handler(
    ctx: Context<Claim>,
    pub_x: [u8; 32],
    pub_y: [u8; 32],
    min_nonce: u32,
    max_nonce: u32,
    total_amount: u64,
    proof: [u8; 256],
) -> Result<()> {
    let manager_key = Pubkey::new_from_array(compress(pub_x, pub_y));
    let mint_key = ctx.accounts.mint.key();
    let expected_seeds = &[
        ctx.accounts.authority.key.as_ref(),
        manager_key.as_ref(),
        ctx.accounts.payment_account.application_account.as_ref(),
        mint_key.as_ref(),
    ];
    let (expected_pda, _) = Pubkey::find_program_address(expected_seeds, ctx.program_id);

    // Verify data account PDA
    require_keys_eq!(
        expected_pda,
        ctx.accounts.recipient_manager_data_account.key(),
        PaymentErrors::InvalidPDA
    );

    //Verify manager authorization
    require!(
        ctx.accounts
            .payment_account
            .is_authorized(&manager_key.key()),
        PaymentErrors::Unauthorized
    );

    // Unpack and verify proof
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
        public_key_to_truncated_hex(ctx.accounts.authority.key().to_bytes())
            .try_into()
            .unwrap(),
        public_key_to_truncated_hex(ctx.accounts.payment_account.key().to_bytes())
            .try_into()
            .unwrap(),
        pub_x,
        pub_y,
    ];

    let mut verifier =
        Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY).unwrap();

    let result = verifier.verify().unwrap();
    require!(result, PaymentErrors::InvalidProof);

    // Update nonce to the max_nonce in the batch
    ctx.accounts.recipient_manager_data_account.nonce = max_nonce;
    ctx.accounts.recipient_manager_data_account.total_amount += total_amount;

    // Transfer the total amount of all the proofs.
    if total_amount > 0 {
        transfer_tokens_from_vault!(
            ctx.accounts,
            payment_vault_token_account,
            recipient_token_account,
            &[&vault_seed!(ctx.accounts.payment_account.key(), id())],
            total_amount
        )?;
    }

    Ok(())
}
