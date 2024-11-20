use crate::id;
use anchor_lang::prelude::*;

/***
 * Program Derived Addresses
 */

fn get_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}

pub fn effect_staking(authority: &Pubkey) -> Pubkey {
    get_address(
        &["stake".as_ref(), id::EFX_TOKEN.as_ref(), authority.as_ref()],
        &id::STAKING_PROGRAM,
    )
}
