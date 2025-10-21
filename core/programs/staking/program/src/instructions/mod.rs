//! Instructions for Effect Staking.

pub mod charge;
pub mod close;
pub mod genesis_stake;
pub mod invest;
pub mod migrate;
pub mod slash;
pub mod stake;
pub mod topup;
pub mod unstake;

pub use charge::*;
pub use close::*;
pub use genesis_stake::*;
pub use invest::*;
pub use migrate::*;
pub use slash::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
