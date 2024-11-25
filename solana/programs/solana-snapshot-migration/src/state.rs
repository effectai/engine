use anchor_lang::prelude::*;

#[constant]
pub const EXPECTED_MESSAGE: &str = "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ";

#[account]
pub struct MetadataAccount {
    pub foreign_public_key: Vec<u8>,
    pub stake_start_time: i64,
}