/***
 * Constants
 */
pub use anchor_lang::prelude::*;

pub const SECONDS_PER_DAY: u128 = 24 * 60 * 60;
pub const STAKE_DURATION_MIN: u128 = 30 * SECONDS_PER_DAY; // 30 days
pub const STAKE_DURATION_MAX: u128 = 365 * SECONDS_PER_DAY; // 1 year
pub const STAKE_MINIMUM_AMOUNT: u64 = 0;
pub const STAKE_AGE_MAX_DAYS: u64 = 1000;

#[cfg(not(feature = "mainnet"))]
pub const CLAIM_START_TIME: i64 = 1704452400; // 2025-01-05 12:00:00 UTC
#[cfg(not(feature = "mainnet"))]
pub const UNSTAKE_DELAY_DAYS: u64 = 0;

#[cfg(feature = "mainnet")]
pub const CLAIM_START_TIME: i64 = 1736074800; // 2025-01-05 12:00:00 UTC
#[cfg(feature = "mainnet")]
pub const UNSTAKE_DELAY_DAYS: u64 = 7;
