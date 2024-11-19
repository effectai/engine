use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum EffectError {
    // generic errors
    #[msg("This account is not authorized to perform this action.")]
    Unauthorized,
    #[msg("This account is owned by an invalid program.")]
    InvalidOwner,
    #[msg("This account has lamports.")]
    LamportsNonNull,
    #[msg("This account is missing a signature.")]
    MissingSignature,
    #[msg("This account is not valid.")]
    InvalidAccount,
    #[msg("This token account is not valid.")]
    InvalidTokenAccount,
    #[msg("This mint is invalid.")]
    InvalidMint,
    #[msg("This account has an invalid vault.")]
    InvalidVault,
    #[msg("This payer account is not valid.")]
    InvalidPayer,
    #[msg("This vault is empty.")]
    VaultEmpty,
    #[msg("This vault is not empty.")]
    VaultNotEmpty,
    #[msg("This Associated Token Account is not valid.")]
    InvalidATA,
}
