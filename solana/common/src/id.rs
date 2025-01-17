use anchor_lang::declare_id;

/***
 * IDs
 */
 pub use authority::ID as ADMIN_AUTHORITY;
 mod authority {
     use super::*;
     #[cfg(feature = "mainnet")]
     declare_id!("nXwHwpf23pp1GVE9AXV3KJTN4orAqWGFgwHQT8E7qEx");
     #[cfg(not(feature = "mainnet"))]
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
 }
