
use anchor_lang::prelude::*;

#[error_code]
pub enum CommonErrors {
    #[msg("Invalid Discriminator")]
    InvalidDiscriminator,
    #[msg("Invalid Claim Type")]
    InvalidClaimType,
}