//! Instructions for Nosana Rewards.

pub mod claim;
pub mod close;
pub mod open;
pub mod update_recipient;
pub mod update_authority;

// pub use claim_fee::*;
pub use claim::*;
pub use close::*;
pub use open::*;
pub use update_recipient::*;
pub use update_authority::*;
