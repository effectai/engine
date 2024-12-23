use anchor_lang::prelude::*;

pub const EFFECT_MIGRATION: Pubkey = pubkey!("WkXR6Wnz1wXr48vw18Q8t7GYm9h3JFUXzAJWDjZopK7");

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
        // check if the foreign public key is valid
        if foreign_address.len() != 20 && foreign_address.len() != 32 {
            return Err(MigrationError::InvalidForeignAddress.into());
        }

        let now = Clock::get()?.unix_timestamp;

        if stake_start_time < 0 {
            return Err(MigrationError::InvalidStakeStartTime.into());
        }

        // if the stake start time is in the future, return an error
        if stake_start_time > now {
            return Err(MigrationError::InvalidStakeStartTime.into());
        }

        self.stake_start_time = stake_start_time;
        self.foreign_address = foreign_address;

        Ok(())
    }
}
