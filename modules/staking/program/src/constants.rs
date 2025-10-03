// import constants from common and mark them for export in the IDL
use anchor_lang::prelude::*;
use effect_common::constants as common_constants;

#[constant]
pub const STAKE_DURATION_MIN: u128 = common_constants::STAKE_DURATION_MIN;
#[constant]
pub const STAKE_DURATION_MAX: u128 = common_constants::STAKE_DURATION_MAX;
#[constant]
pub const STAKE_MINIMUM_AMOUNT: u64 = common_constants::STAKE_MINIMUM_AMOUNT;
#[constant]
pub const UNSTAKE_DELAY_DAYS: u64 = common_constants::UNSTAKE_DELAY_DAYS;

#[cfg(feature = "localnet")]
#[constant]
pub const SLASH_AUTHORITY: Pubkey = pubkey!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");

#[cfg(feature = "mainnet")]
#[constant]
pub const SLASH_AUTHORITY: Pubkey = pubkey!("REPLACE_WITH_MAINNET_AUTHORITY_PUBKEY");
