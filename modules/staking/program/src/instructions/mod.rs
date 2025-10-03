//! Instructions for Effect Staking.

pub mod close;
pub mod genesis_stake;
pub mod redeem;
pub mod slash;
pub mod stake;
pub mod topup;
pub mod unstake;
pub mod update_authority;

pub use close::*;
pub use genesis_stake::*;
pub use redeem::*;
pub use slash::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
pub use update_authority::*;
