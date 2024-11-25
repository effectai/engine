//! Instructions for Effect Staking.

pub mod close;
pub mod extend;
pub mod init;
pub mod restake;
pub mod slash;
pub mod stake;
pub mod topup;
pub mod unstake;
pub mod update_settings;
pub mod withdraw;
pub mod genesis_stake;

pub use close::*;
pub use extend::*;
pub use restake::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
pub use withdraw::*;
pub use genesis_stake::*;

pub use init::*;
pub use slash::*;
pub use update_settings::*;
