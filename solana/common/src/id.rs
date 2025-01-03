use anchor_lang::declare_id;

/***
 * IDs
 */
 pub use authority::ID as ADMIN_AUTHORITY;
 mod authority {
     use super::*;
     #[cfg(feature = "mainnet")]
     declare_id!("admnVasr46cumirLqEXb5JderZEv3BMMcFnZwyK4Lo3");
     #[cfg(not(feature = "mainnet"))]
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
 }
