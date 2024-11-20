/***
 * Constants
 */

// number of decimals for the Effect native token
// https://explorer.solana.com/address/nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7
pub const EFX_DECIMALS: u64 = 1_000_000;

// total supply the Effect native token
pub const EFX_TOTAL_SUPPLY: u128 = 600_000_000 * EFX_DECIMALS as u128;

// prefix used for PDAs to avoid certain collision attacks
// https://en.wikipedia.org/wiki/Collision_attack#Chosen-prefix_collision_attack
pub const PREFIX_SETTINGS: &str = "settings";
pub const PREFIX_STAKE: &str = "stake";
pub const PREFIX_STATS: &str = "stats";
pub const PREFIX_VAULT: &str = "vault";