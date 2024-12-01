pub mod stake_program {
    use anchor_lang::prelude::*;

    declare_id!("eR1sM73NpFqq7DSR5YDAgneWW29AZA8sRm1BFakzYpH");

    #[account]
    pub struct StakeAccount {
        pub amount: u64,
        pub authority: Pubkey,
        pub lock_duration: u64,
        pub stake_start_time: i64,
        pub vault_token_account: Pubkey,
        pub xefx: u128,
    }

    impl StakeAccount {
        pub fn init(
            &mut self,
            amount: u64,
            authority: Pubkey,
            lock_duration: u64,
            vault_token_account: Pubkey,
            stake_start_time: i64,
        ) {
            self.amount = amount;
            self.authority = authority;
            self.lock_duration = lock_duration;

            // time stake is set to the current block timestamp
            self.stake_start_time = stake_start_time;
            self.vault_token_account = vault_token_account;

            self.update_xefx();
        }

        pub fn unstake(&mut self, amount: u64) -> Result<()> {
            self.amount -= amount;
            self.update_xefx();
            Ok(())
        }

        pub fn restake(&mut self, amount: u64) -> Result<()> {
            self.amount = amount;
            self.update_xefx();
            Ok(())
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

        pub fn topup(&mut self, amount: u64) {
            self.stake_start_time = StakeAccount::dilute_stake_time(
                self.stake_start_time,
                self.amount,
                Clock::get().unwrap().unix_timestamp,
                amount,
            );

            self.amount += amount;
            self.update_xefx();
        }

        pub fn slash(&mut self, amount: u64) {
            self.amount -= amount;
            self.update_xefx();
        }

        pub fn extend(&mut self, duration: u64) -> Result<()> {
            self.lock_duration += duration;
            self.update_xefx();
            Ok(())
        }

        fn update_xefx(&mut self) {
            self.xefx = self.amount as u128
        }
    }
}
