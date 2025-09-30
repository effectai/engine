use anchor_lang::prelude::*;
use effect_common::constants::{SECONDS_PER_DAY, STAKE_AGE_MAX_DAYS};

pub struct SettingsAccount {
    pub authority: Pubkey,
    pub token_account: Pubkey,
}

impl SettingsAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<SettingsAccount>();

    pub fn set(&mut self, authority: Pubkey, token_account: Pubkey) -> Result<()> {
        self.authority = authority;
        self.token_account = token_account;
        Ok(())
    }
}

#[account]
pub struct StakeAccount {
    pub amount: u64,
    pub authority: Pubkey,
    pub lock_duration: u64,
    pub stake_start_time: i64,
    pub weighted_amount: u128,
    pub mint: Pubkey,
    pub scope: Pubkey,
}

impl StakeAccount {
    pub fn init(
        &mut self,
        amount: u64,
        authority: Pubkey,
        lock_duration: u64,
        stake_start_time: i64,
        mint: Pubkey,
        scope: Pubkey,
    ) {
        self.amount = amount;
        self.authority = authority;
        self.lock_duration = lock_duration;
        self.mint = mint;
        self.scope = scope;

        if stake_start_time
            < Clock::get().unwrap().unix_timestamp
                - STAKE_AGE_MAX_DAYS as i64 * SECONDS_PER_DAY as i64
        {
            self.stake_start_time = Clock::get().unwrap().unix_timestamp
                - STAKE_AGE_MAX_DAYS as i64 * SECONDS_PER_DAY as i64;
        } else {
            self.stake_start_time = stake_start_time;
        }

        self.update_weighted_amount();
    }

    fn dilute_stake_time(
        current_time: i64,
        current_amount: u64,
        new_time: i64,
        new_amount: u64,
    ) -> i64 {
        let total_amount = current_amount + new_amount;
        let weighted_time = ((current_time as i128 * current_amount as i128)
            + (new_time as i128 * new_amount as i128))
            / total_amount as i128;

        weighted_time as i64
    }

    pub fn topup(&mut self, amount: u64, new_time: i64) {
        let capped_stake_start: i64 = if self.stake_start_time
            < Clock::get().unwrap().unix_timestamp
                - STAKE_AGE_MAX_DAYS as i64 * SECONDS_PER_DAY as i64
        {
            Clock::get().unwrap().unix_timestamp
                - STAKE_AGE_MAX_DAYS as i64 * SECONDS_PER_DAY as i64
        } else {
            self.stake_start_time
        };

        self.stake_start_time =
            StakeAccount::dilute_stake_time(capped_stake_start, self.amount, new_time, amount);

        self.amount += amount;
        self.update_weighted_amount();
    }

    pub fn unstake(&mut self, amount: u64) -> Result<()> {
        self.amount -= amount;
        self.update_weighted_amount();
        Ok(())
    }

    fn update_weighted_amount(&mut self) {
        self.weighted_amount = self.amount as u128
    }
}
