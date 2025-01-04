use anchor_lang::prelude::*;

pub const EFFECT_MIGRATION: Pubkey = pubkey!("6YPaGWd3o9cuz3Kn62zHg7BcMvt5wd2dKSDirxrcEa39");

declare_id!(EFFECT_MIGRATION);

#[derive(Debug, Clone)]
pub struct MigrationProgram;

impl anchor_lang::Id for MigrationProgram {
    fn id() -> Pubkey {
        EFFECT_MIGRATION
    }
}

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
