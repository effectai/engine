use anchor_lang::prelude::*;

use crate::constants::EFX_TOTAL_SUPPLY;
/***
 * Accounts
 */

/// The `ReflectionAccount` struct holds all the information on the reflection pool.
#[account]
pub struct ReflectionAccount {
    pub rate: u128,
    pub total_reflection: u128,
    pub total_xefx: u128,
    pub vault_token_account: Pubkey,
    pub vault_bump: u8,
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

    pub fn init(&mut self, vault_token_account: Pubkey) -> Result<()> {
        self.rate = ReflectionAccount::INITIAL_RATE;
        self.total_reflection = 0;
        self.total_xefx = 0;
        self.vault_token_account = vault_token_account;
        Ok(())
    }

    pub fn migrate(
        &mut self,
        rate: u128,
        reflection: u128,
        xefx: u128,
        vault_token_account: Pubkey,
    ) {
        self.rate = rate;
        self.total_reflection = reflection;
        self.total_xefx = xefx;
        self.vault_token_account = vault_token_account;
    }

    pub fn add_fee(&mut self, fee: u128) {
        self.total_xefx += fee;
        self.rate = self.total_reflection / self.total_xefx;
    }

    pub fn add_rewards_account(&mut self, xefx: u128, reward_xefx: u128) -> u128 {
        let reflection: u128 = (xefx + reward_xefx) * self.rate;

        self.total_reflection += reflection;
        self.total_xefx += xefx;

        reflection
    }

    pub fn remove_rewards_account(&mut self, reflection: u128, xefx: u128) -> Result<()> {
        self.total_xefx -= xefx;
        self.total_reflection -= reflection;
        Ok(())
    }
}


/// The `RewardAccount` struct holds all the information for any given user account.
#[account]
pub struct RewardAccount {
    pub authority: Pubkey,
    pub reflection: u128,
    pub xefx: u128,
}

impl RewardAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

    pub fn init(
        &mut self,
        authority: Pubkey,
        reflection: u128,
        tokens: u128,
    ) -> Result<()> {
        self.authority = authority;
        self.reflection = reflection;
        self.xefx = tokens;
        Ok(())
    }

    pub fn update(&mut self, reflection: u128, xefx: u128) -> Result<()> {
        self.reflection = reflection;
        self.xefx = xefx;
        Ok(())
    }

    pub fn get_amount(&mut self, rate: u128) -> u128 {
        self.reflection / rate - self.xefx
    }
}