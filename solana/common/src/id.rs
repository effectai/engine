use anchor_lang::declare_id;

/***
 * IDs
 */
 pub use authority::ID as AUTHORITY;
 mod authority {
     use super::*;
     #[cfg(feature = "mainnet")]
     //TODO:: grind keypair
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
     #[cfg(not(feature = "mainnet"))]
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
 }

pub use effect_token::ID as EFFECT_TOKEN;
mod effect_token {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("mintTrhsrzTrrZo2kMJ7FKcJ9HCdRN8nadzKJFi9f4r");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("mintTrhsrzTrrZo2kMJ7FKcJ9HCdRN8nadzKJFi9f4r");
}
