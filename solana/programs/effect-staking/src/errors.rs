
use anchor_lang::prelude::*;

#[error_code]
pub enum StakingErrors {
    #[msg("This account has an invalid vault.")]
    InvalidVault,
    #[msg("This account is not authorized to perform this action.")]
    Unauthorized,
    #[msg("This stake is already unstaked.")]
    AlreadyUnstaked,
    #[msg("This stake is not allowed to decrease.")]
    Decreased,
    #[msg("This stake is not yet unstaked.")]
    NotUnstaked,
    #[msg("This stake is still locked.")]
    Locked,
    #[msg("This vault is not empty.")]
    VaultNotEmpty,
    #[msg("The stake duration is too long.")]
    DurationTooLong,
    #[msg("The stake duration is too short.")]
    DurationTooShort,
    #[msg("The vault authority does not match.")]
    VaultAuthorityMismatch,
    #[msg("The stake amount is not enough.")]
    AmountNotEnough,
    #[msg("This stake is already staked.")]
    AlreadyStaked,
    #[msg("Invalid reward account.")]
    InvalidRewardAccount,
    #[msg("Invalid stake account.")]
    InvalidStakeAccount,
    #[msg("Stake acount is not empty.")]
    StakeNotEmpty
}