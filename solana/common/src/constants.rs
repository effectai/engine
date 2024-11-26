/***
 * Constants
 */
pub use anchor_lang::prelude::*;

pub const EFX_DECIMALS: u64 = 1_000_000;
pub const EFX_TOTAL_SUPPLY: u128 = 600_000_000 * EFX_DECIMALS as u128;
pub const PREFIX_SETTINGS: &str = "settings";
pub const PREFIX_STAKE: &str = "stake";
pub const PREFIX_STATS: &str = "stats";
pub const PREFIX_VAULT: &str = "vault";
pub const PREFIX_VESTING: &str = "vesting";

pub const SECONDS_PER_DAY: u128 = 24 * 60 * 60;

pub const STAKE_DURATION_MIN: u128 = 30 * SECONDS_PER_DAY; // 30 days
pub const STAKE_DURATION_MAX: u128 = 365 * SECONDS_PER_DAY; // 1 year
pub const STAKE_MINIMUM_AMOUNT: u64 = 0;

pub const XEFX_DIV: u128 = 4 * STAKE_DURATION_MAX / 12; // 0.25 growth per month
pub const XEFX_PRECISION: u128 = u128::pow(10, 15); // 1e15
