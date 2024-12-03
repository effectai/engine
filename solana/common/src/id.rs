use anchor_lang::declare_id;

/***
 * IDs
 */

pub use system_program::ID as SYSTEM_PROGRAM;
mod system_program {
    use super::*;
    declare_id!("11111111111111111111111111111111");
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

pub use authority::ID as AUTHORITY;
mod authority {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("EffectrMxfrZbyCx5CotBVrzxiPcrnhj6ickpX9vRkB");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devEs8EACCACJqJxJb2jBTRVsmrtsPobvJvMpD33mht");
}

pub use token_account::ID as TOKEN_ACCOUNT;
mod token_account {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("A9V8JkR5HihvFpHq1ZbwrpPAGBhsGfeWw5TVcUdGf2dg");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("HLtABkKqsUjb4ECPEnvad6HN7QYf6ANHahAeZQXrAGgV");
}

pub use rewards_program::ID as REWARDS_PROGRAM;
mod rewards_program {
    use super::*;
    declare_id!("HJR3op52N7tNycXqQnVu8cDnxH7udp4pYi1ps9S1hdBz");
}
