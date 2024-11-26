pub mod stake_program {
    use anchor_lang::prelude::*;
    use crate::constants::{XEFX_DIV, XEFX_PRECISION};

    declare_id!("eR1sM73NpFqq7DSR5YDAgneWW29AZA8sRm1BFakzYpH");

    #[account]
    pub struct StakeAccount {
        pub amount: u64,
        pub authority: Pubkey,
        pub duration: u64,
        pub time_unstake: i64,
        pub time_stake: i64,
        pub vault_token_account: Pubkey,
        pub vault_bump: u8,
        pub xefx: u128,
    }

    impl StakeAccount {
        pub fn init(
            &mut self,
            amount: u64,
            authority: Pubkey,
            duration: u64,
            vault_token_account: Pubkey,
            vault_bump: u8,
            time_stake: i64,
        ) {
            self.amount = amount;
            self.authority = authority;
            self.duration = duration;
            self.time_unstake = 0;

            // time stake is set to the current block timestamp
            self.time_stake = time_stake;
            self.vault_token_account = vault_token_account;

            self.vault_bump = vault_bump;
            self.update_xefx();
        }

        pub fn unstake(&mut self, now: i64) -> Result<()> {
            self.time_unstake = now;
            self.update_xefx();
            Ok(())
        }

        pub fn restake(&mut self, amount: u64) -> Result<()> {
            self.amount = amount;
            self.time_unstake = 0;
            self.update_xefx();
            Ok(())
        }

        pub fn withdraw(&self, balance: u64, now: i64) -> u64 {
            let elapsed: u64 = u64::try_from(now - self.time_unstake).unwrap();

            if elapsed >= self.duration {
                balance
            } else {
                let precision: u64 = u64::MAX / std::cmp::max(self.amount, elapsed) - 1;
                elapsed * precision / self.duration * self.amount / precision
                    - (self.amount - balance)
            }
        }

        fn dilute_stake_time(
            current_time: i64,
            current_amount: u64,
            new_time: i64,
            new_amount: u64,
        ) -> i64 {
            let total_amount = current_amount + new_amount;
            let weighted_time = (current_time * current_amount as i64
                + new_time * new_amount as i64)
                / total_amount as i64;
            weighted_time
        }

        pub fn topup(&mut self, amount: u64) {
            self.time_stake = StakeAccount::dilute_stake_time(
                self.time_stake,
                self.amount,
                Clock::get().unwrap().unix_timestamp,
                amount,
            );

            msg!("Diluted stake time: {}", self.time_stake);

            self.amount += amount;
            self.update_xefx();
        }

        pub fn slash(&mut self, amount: u64) {
            self.amount -= amount;
            self.update_xefx();
        }

        pub fn extend(&mut self, duration: u64) -> Result<()> {
            self.duration += duration;
            self.update_xefx();
            Ok(())
        }

        fn update_xefx(&mut self) {
            self.xefx = if self.time_unstake != 0 {
                0
            } else {
                u128::from(self.amount) 
            }
        }
    }
}
