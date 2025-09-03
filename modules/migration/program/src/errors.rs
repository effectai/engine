use anchor_lang::prelude::*;
// Custom Error
#[error_code]
pub enum MigrationError {
    #[msg("Invalid message provided.")]
    MessageInvalid,

    #[msg("Invalid signature provided.")]
    InvalidSignature,

    #[msg("Public key does not match the foreign public key.")]
    PublicKeyMismatch,

    #[msg("Invalid claim account provided.")]
    InvalidClaimAccount,

    #[msg("Invalid recovery id.")]
    InvalidRecoveryId,

    #[msg("Invalid action provided.")]
    InvalidActions,

    #[msg("The memo in the transaction does not match the expected value.")]
    MemoMismatch,
   
    #[msg("Memo field not found in actions.")]
    MemoNotFound,

    #[msg("Invalid mint provided.")]
    InvalidMint,

    #[msg("Invalid Foreign Address")]
    InvalidForeignAddress,

    #[msg("Invalid Stake Start Time")]
    InvalidStakeStartTime,

    #[msg("Claming not started yet.")]
    ClaimingNotStarted,
}
