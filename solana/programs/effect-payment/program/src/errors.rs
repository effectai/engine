use anchor_lang::prelude::*;

/// Custom error codes
#[error_code]
pub enum PaymentErrors {
    #[msg("Unauthorized.")]
    Unauthorized,

    #[msg("Signature verification failed.")]
    SigVerificationFailed,

    #[msg("Invalid Proof")]
    InvalidProof,
}
