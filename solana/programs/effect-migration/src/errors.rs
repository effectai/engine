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

    #[msg("Invalid metadata provided.")]
    InvalidMetadataAccount,

    #[msg("Invalid recovery id provided.")]
    InvalidRecoveryId,

    #[msg("Invalid action provided.")]
    InvalidActions,

    #[msg("The memo in the transaction does not match the expected value.")]
    MemoMismatch,
   
    #[msg("Invalid transaction message.")]
    InvalidMessage,

    #[msg("Memo field not found in actions.")]
    MemoNotFound,

    #[msg("Invalid mint provided.")]
    InvalidMint,
}
