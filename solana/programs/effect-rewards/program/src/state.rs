use anchor_lang::prelude::*;

use crate::RewardErrors;
/***
 * Accounts
 */

/// The `ReflectionAccount` struct holds all the information on the reflection pool.
#[account]
pub struct ReflectionAccount {
    pub rate: u128,
    pub total_reflection: u128,
    pub total_weighted_amount: u128,
}

impl ReflectionAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<ReflectionAccount>();

    pub fn init(&mut self, total_supply: u64) -> Result<()> {
        // set initial rate based on total supply of the given mint.
        self.rate = (u128::MAX - (u128::MAX % total_supply as u128 )) / total_supply as u128;
        self.total_reflection = 0;
        self.total_weighted_amount = 0;

        Ok(())
    }

    pub fn topup(&mut self, weighted_amount: u128) -> Result<()> {

        // dont allow a topup if the total_reflection = 0
        if self.total_reflection == 0 {
            return Err(RewardErrors::ReflectionInvalid.into());
        }

        self.total_weighted_amount += weighted_amount;
        self.rate = self.total_reflection / self.total_weighted_amount;

        Ok(())
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
