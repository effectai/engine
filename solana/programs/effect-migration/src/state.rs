use anchor_lang::prelude::*;

#[constant]
pub const EXPECTED_MESSAGE: &str =
    "Effect.AI: I authorize my tokens to be claimed at the following Solana address";

#[account]
pub struct MigrationAccount {
    pub foreign_address: Vec<u8>,
    pub stake_start_time: i64,
}

#[error_code]
pub enum MigrationError {
    #[msg("Invalid Foreign Address")]
    InvalidForeignAddress = 9,

    #[msg("Invalid Stake Start Time")]
    InvalidStakeStartTime = 10,
}

impl MigrationAccount {
    pub fn initialize(&mut self, foreign_address: Vec<u8>, stake_start_time: i64) -> Result<()> {
        // Validate the foreign public key length
        if ![20, 32].contains(&foreign_address.len()) {
            return Err(MigrationError::InvalidForeignAddress.into());
        }

        let now = Clock::get()?.unix_timestamp;

        // Validate the stake start time
        if stake_start_time > now {
            return Err(MigrationError::InvalidStakeStartTime.into());
        }

        // Set the stake start time to the provided value or default to current time
        self.stake_start_time = if stake_start_time > 0 {
            stake_start_time
        } else {
            now
        };

        // Set the foreign address
        self.foreign_address = foreign_address;

        Ok(())
    }
}
