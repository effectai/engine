use anchor_lang::declare_id;

/***
 * IDs
 */
 pub use authority::ID as ADMIN_AUTHORITY;
 mod authority {
     use super::*;
     #[cfg(feature = "mainnet")]
     //TODO:: grind keypair
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
     #[cfg(not(feature = "mainnet"))]
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
 }
