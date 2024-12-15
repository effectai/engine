use anchor_lang::prelude::*;
/***
 * Accounts
 */

/// The `ReflectionAccount` struct holds all the information on the reflection pool.
#[account]
pub struct ReflectionAccount {
    pub mint: Pubkey,
    pub rate: u128,
    pub total_reflection: u128,
    pub total_weighted_amount: u128,
}

impl ReflectionAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<ReflectionAccount>();

    pub fn init(&mut self, total_supply: u64) -> Result<()> {
        // set initial rate based on total supply
        self.rate = (u128::MAX - (u128::MAX % total_supply as u128 )) / total_supply as u128;
        self.total_reflection = 0;
        self.total_weighted_amount = 0;
        Ok(())
    }

    pub fn topup(&mut self, weighted_amount: u128) {
        self.total_weighted_amount += weighted_amount;
        self.rate = self.total_reflection / self.total_weighted_amount;
    }

    pub fn add_rewards_account(&mut self, xefx: u128, weighted_amount: u128) -> u128 {
        let reflection: u128 = (xefx + weighted_amount) * self.rate;

        self.total_reflection += reflection;
        self.total_weighted_amount += xefx;

        reflection
    }

    pub fn remove_rewards_account(
        &mut self,
        reflection: u128,
        weighted_amount: u128,
    ) -> Result<()> {
        self.total_weighted_amount -= weighted_amount;
        self.total_reflection -= reflection;
        Ok(())
    }
}
