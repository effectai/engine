use anchor_lang::prelude::*;

use crate::constants::EFX_TOTAL_SUPPLY;
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

    /*
    This number should be as high as possible wihtout causing overflows.

    Rate gets multiplied by tokens to get reflections, and is the divisor of
    reflections to get the xefx. A higher initial rate makes sure that
    reflections will be large numbers. This is nice as total_xefx will be forever
    increasing.

    The formula below makes initial rate as large as it can be, and rounds it
    down a little to a clean multiple of the total supply.
    */

    pub const INITIAL_RATE: u128 = (u128::MAX - (u128::MAX % EFX_TOTAL_SUPPLY)) / EFX_TOTAL_SUPPLY;
    // pub const INITIAL_RATE: u128 = u128::pow(10, 15);

    pub fn init(&mut self) -> Result<()> {
        self.rate = ReflectionAccount::INITIAL_RATE;
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
