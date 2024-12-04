//! Instructions for Effect Staking.

pub mod close;
pub mod init;
pub mod slash;
pub mod stake;
pub mod topup;
pub mod unstake;
pub mod update_settings;
pub mod genesis_stake;

pub use close::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
pub use genesis_stake::*;

// pub use init::*;
// pub use slash::*;
// pub use update_settings::*;
