use anchor_lang::prelude::*;

#[constant]
pub const EXPECTED_MESSAGE: &str = "Effect.AI: I authorize my tokens to be claimed at the following Solana address";


struct Payment {
    amount: u64,
    recipient: Pubkey,
    escrow_account: Account<'info, TokenAccount>,
    signature: Vec<u8>,
}
