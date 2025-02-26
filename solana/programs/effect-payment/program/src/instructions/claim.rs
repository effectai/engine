use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak::hash;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_payment_common::{MerkleRootAccount, Payment, PaymentAccount};
use solana_merkle_tree::merkle_tree::Proof;
use solana_merkle_tree::MerkleTree;
use solana_program::instruction::Instruction;
use solana_program::sysvar::instructions::{load_instruction_at_checked, ID as IX_ID};

use crate::errors::PaymentErrors;
use crate::utils::{sha256, verify_ed25519_ix};
#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut, seeds = [payment_account.key().as_ref()], bump) ]
    pub payment_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority, 
        token::mint = mint, 
        token::authority = user_payment_vault,
        seeds = [payment_account.key().as_ref()],
        bump
    )]
    pub user_payment_vault: Account<'info, TokenAccount>,

    #[account(mut,
        seeds = [b"merkle_root_account"],
        bump
    )]
    pub merkle_root_account: Account<'info, MerkleRootAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The address check is needed because otherwise
    /// the supplied Sysvar could be anything else.
    /// The Instruction Sysvar has not been implemented
    /// in the Anchor framework yet, so this is the safe approach.
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
}

fn serialize_payment_message(payment: &Payment) -> Result<Vec<u8>> {
    let mut message = Vec::new();

    message.extend_from_slice(&payment.id);
    message.extend_from_slice(&payment.amount.to_le_bytes());
    message.extend_from_slice(payment.mint.as_ref());
    message.extend_from_slice(payment.escrow_account.as_ref());
    message.extend_from_slice(payment.recipient_token_account.as_ref());

    Ok(message)
}

pub fn handler(
    ctx: Context<Claim>,
    payment: Payment,
    authority: Pubkey,
    signature: Vec<u8>,
    proof: Vec<[u8; 32]>
) -> Result<()> {
    //check if authority is part of the payment account authorities
    if !ctx.accounts.payment_account.is_authorized(&authority) {
        return Err(PaymentErrors::Unauthorized.into());
    }

    let merkle_root = ctx.accounts.merkle_root_account.merkle_root;

    let leaf = sha256(&payment.id);
    let merkle_tree = MerkleTree::new(merkle_root, proof);


    let msg = serialize_payment_message(&payment)?;
    let hashed_msg = sha256(&msg);

    let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;

    verify_ed25519_ix(
        &ix,
        &authority.to_bytes(),
        &hashed_msg,
        signature.as_slice(),
    )?;

    //open a vesting account for the recipient

    Ok(())
}
