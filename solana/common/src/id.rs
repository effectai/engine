use anchor_lang::declare_id;

/***
 * IDs
 */

 pub use authority::ID as AUTHORITY;
 mod authority {
     use super::*;
     #[cfg(feature = "mainnet")]
     declare_id!("TODO::GRIND_KEY_PAIR");
     #[cfg(not(feature = "mainnet"))]
     declare_id!("authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV");
 }

pub use effect_token::ID as EFFECT_TOKEN;
mod effect_token {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("TODO::GRIND_KEY_PAIR");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("mintTrhsrzTrrZo2kMJ7FKcJ9HCdRN8nadzKJFi9f4r");
}

pub use effect_vesting::ID as VESTING_PROGRAM;
mod effect_vesting {
    use super::*;
    declare_id!("GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe");
}

pub use migration_program::ID as MIGRATION_PROGRAM;
mod migration_program {
    use super::*;
    declare_id!("BraRBZAVsUaxs46ob4gY5o9JvDHTGppChigyz7qwJm9g");
}

pub use staking_program::ID as STAKING_PROGRAM;
mod staking_program {
    use super::*;
    declare_id!("3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw");
}

pub use rewards_program::ID as REWARDS_PROGRAM;
mod rewards_program {
    use super::*;
    declare_id!("HJR3op52N7tNycXqQnVu8cDnxH7udp4pYi1ps9S1hdBz");
}
