use anchor_lang::prelude::*;
// Custom Error
#[error_code]
pub enum CustomError {
    #[msg("Invalid message provided.")]
    MessageInvalid,

    #[msg("Invalid signature provided.")]
    InvalidSignature,

    #[msg("Public key does not match the foreign public key.")]
    PublicKeyMismatch,
}
