use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::cpi;
use effect_common::transfer_tokens_from_vault;
use effect_payment_common::{Payment, PaymentAccount, RecipientPaymentDataAccount};
use solana_program::instruction::Instruction;
use solana_program::sysvar::instructions::{load_instruction_at_checked, ID as IX_ID};

use crate::errors::PaymentErrors;
use crate::utils::{sha256, verify_ed25519_ix};
use crate::{id, vault_seed};
#[derive(Accounts)]
pub struct Claim<'info> {
    #[account()]
    pub payment_account: Account<'info, PaymentAccount>,

    #[account(mut, seeds = [payment_account.key().as_ref()], bump) ]
    pub payment_vault_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_payment_data_account: Account<'info, RecipientPaymentDataAccount>,

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
    message.extend_from_slice(payment.recipient_token_account.as_ref());
    message.extend_from_slice(&payment.nonce.to_le_bytes());

    Ok(message)
}

pub fn handler(ctx: Context<Claim>, payments: Vec<Payment>, authority: Pubkey) -> Result<()> {
    //check if authority is part of the payment account authorities
    require!(
        ctx.accounts.payment_account.is_authorized(&authority),
        PaymentErrors::Unauthorized
    );

    let mut highest_nonce = ctx.accounts.recipient_payment_data_account.nonce;

    let (msgs, total_amount) =
        payments
            .into_iter()
            .try_fold((Vec::new(), 0u64), |(mut msgs, acc), payment| {
                require!(payment.amount > 0, PaymentErrors::InvalidPayment);
                require!(
                    payment.nonce >= highest_nonce,
                    PaymentErrors::InvalidPayment
                );

                highest_nonce = highest_nonce.max(payment.nonce);
                msgs.push(sha256(&serialize_payment_message(&payment)?));

                Ok((msgs, acc + payment.amount))
            })?;

    // verify the message & signatures
    let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;
    verify_ed25519_ix(
        &ix,
        &[
            authority.to_bytes().as_slice(),
            authority.to_bytes().as_slice(),
        ],
        &msgs.iter().map(|m| m.as_slice()).collect::<Vec<_>>(),
    )?;

    // update the nonce
    ctx.accounts.recipient_payment_data_account.nonce = highest_nonce;

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
