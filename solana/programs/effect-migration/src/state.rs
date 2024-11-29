use anchor_lang::prelude::*;

#[constant]
pub const EXPECTED_MESSAGE: &str = "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ";

#[account]
pub struct ClaimTokenAccount {
    pub foreign_public_key: Vec<u8>,
}

impl ClaimTokenAccount {
    pub fn initialize(&mut self, foreign_public_key: Vec<u8>) {
        self.foreign_public_key = foreign_public_key;
    }
}

#[account]
pub struct ClaimStakeAccount {
    pub foreign_public_key: Vec<u8>,
    pub stake_start_time: i64,
}

impl ClaimStakeAccount {
    pub fn initialize(&mut self, foreign_public_key: Vec<u8>, stake_start_time: i64) {
        self.foreign_public_key = foreign_public_key;
        self.stake_start_time = stake_start_time;
    }
}
