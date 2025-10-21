use anchor_lang::prelude::*;

#[error_code]
pub enum RewardErrors {
    #[msg("This account has an invalid reflection.")]
    ReflectionInvalid,
    #[msg("This account has an invalid vault.")]
    InvalidVault,
    #[msg("This account is not authorized to perform this action.")]
    Unauthorized,
    #[msg("This stake is already unstaked.")]
    AlreadyUnstaked,
    #[msg("This stake is not allowed to decrease.")]
    Decreased,
    #[msg("No Claimable Rewards")]
    NoClaimableRewards,
    #[msg("Invalid Mint")]
    InvalidMint,
    #[msg("Scope mismatch")]
    ScopeMismatch,
    #[msg("Mismatched unstake permission")]
    MismatchedUnstakePermission,
    #[msg("This account has already been migrated.")]
    AlreadyMigrated,
}
