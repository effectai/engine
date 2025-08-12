
use anchor_lang::prelude::*;

#[error_code]
pub enum VestingErrors {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("This pool has not started yet.")]
    NotStarted,
    #[msg("This pool does not have enough funds.")]
    Underfunded,
    #[msg("This pool is not closeable.")]
    NotCloseable,
    #[msg("This pool has a different claim type.")]
    WrongClaimType,
    #[msg("This pool does not match the beneficiary.")]
    WrongBeneficiary,
    #[msg("This pool has an invalid token account.")]
    InvalidTokenAccount,
    #[msg("Invalid vault")]
    InvalidVault,
    #[msg("Claim failed")]
    ClaimFailed,
    
}