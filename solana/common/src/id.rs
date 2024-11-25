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
    declare_id!("EabRXJfYfzbkTTq5546mxDiT5yv2k2rjjN4kY6c4S9Br");
}

pub use migration_program::ID as MIGRATION_PROGRAM;
mod migration_program {
    use super::*;
    declare_id!("9hJuxBiFY82YiciAa6wERpHX8s9n1uvzhwaUSFoBJnZD");
}

pub use staking_program::ID as STAKING_PROGRAM;
mod staking_program {
    use super::*;
    declare_id!("eR1sM73NpFqq7DSR5YDAgneWW29AZA8sRm1BFakzYpH");
}

pub use efx_token::ID as EFX_TOKEN;
mod efx_token {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");
}

pub use authority::ID as AUTHORITY;
mod authority {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("EffectrMxfrZbyCx5CotBVrzxiPcrnhj6ickpX9vRkB");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");
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
    declare_id!("AVKZ1LKwV7U5jQPdMev1iQ3rQrcQqzV6AwMfAZwQJomT");
}
