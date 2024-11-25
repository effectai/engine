use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum EffectStakingError {
    #[msg("This amount is not enough.")]
    AmountNotEnough,
    #[msg("This stake is already running.")]
    AlreadyInitialized,
    #[msg("This stake is already claimed.")]
    AlreadyClaimed,
    #[msg("This stake is already staked.")]
    AlreadyStaked,
    #[msg("This stake is already unstaked.")]
    AlreadyUnstaked,
    #[msg("This stake is not yet unstaked.")]
    NotUnstaked,
    #[msg("This stake is still locked.")]
    Locked,
    #[msg("This stake duration is not long enough.")]
    DurationTooShort,
    #[msg("This stake duration is too long.")]
    DurationTooLong,
    #[msg("This stake account does not exist.")]
    DoesNotExist,
    #[msg("This stake is not allowed to decrease.")]
    Decreased,
    #[msg("This stake does not belong to the authority.")]
    InvalidStakeAccount,
    #[msg("This stake does not belong to the signer.")]
    IncorrectSigner,
    #[msg("This stake does not belong to the vault.")]
    VaultAuthorityMismatch
    
}
