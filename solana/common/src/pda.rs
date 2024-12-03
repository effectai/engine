use crate::id;
use anchor_lang::prelude::*;

/***
 * Program Derived Addresses
 */

fn get_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}
