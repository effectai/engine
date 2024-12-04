use anchor_lang::prelude::*;

use crate::errors::MigrationError;

#[constant]
pub const EXPECTED_MESSAGE: &str = "Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ";

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ClaimType {
    Token {},
    Stake {
        stake_start_time: i64,
    },
}

#[account]
pub struct ClaimAccount {
    pub foreign_public_key: Vec<u8>,
    pub claim_type: ClaimType,
}

impl ClaimAccount {
    pub fn initialize(&mut self, foreign_public_key: Vec<u8>, claim_type: ClaimType) -> Result<()> {

        // check if the foreign public key is valid
        if foreign_public_key.len() != 20 && foreign_public_key.len() != 32 {
            return Err(MigrationError::InvalidForeignPublicKey.into());
        }

        self.foreign_public_key = foreign_public_key;
        self.claim_type = claim_type;
        Ok(())
    }
}