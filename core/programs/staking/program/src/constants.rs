// import constants from common and mark them for export in the IDL
use anchor_lang::prelude::*;
use effect_common::constants as common_constants;

#[constant]
pub const UNSTAKE_DELAY_DAYS: u64 = common_constants::UNSTAKE_DELAY_DAYS;
