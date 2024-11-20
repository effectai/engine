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

pub use close::*;
pub use extend::*;
pub use init::*;
pub use restake::*;
pub use slash::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
pub use update_settings::*;
pub use withdraw::*;
