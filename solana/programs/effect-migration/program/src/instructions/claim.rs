use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::close_vault;
use effect_common::cpi;
use effect_common::id::AUTHORITY;
use effect_migration_common::{MigrationAccount, MigrationProgram};
use effect_staking::{cpi::accounts::GenesisStake, program::EffectStaking};
use effect_staking_common::StakeAccount;
use crate::utils::{eos_format, ethereum_format, get_expected_message_bytes, hash_message, parse_recovery_id, recover_public_key, split_signature, validate_message};
use crate::{errors::MigrationError, vault_seed, genesis_stake};

use anchor_lang::{prelude::Pubkey};

#[derive(Accounts)]
#[instruction(signature: Vec<u8>, message: Vec<u8>)]
pub struct ClaimStake<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = authority,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
	close =  rent_receiver,
        seeds = [mint.key().as_ref(), migration_account.foreign_public_key.as_slice()],
        bump
    )]
    pub migration_account: Account<'info, MigrationAccount>,

    #[account(
        mut, 
        token::authority = migration_vault_token_account, 
        token::mint = mint,
        seeds = [migration_account.key().as_ref()],
        bump,
    )]
    pub migration_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut, has_one = authority)]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut, 
        token::authority = stake_vault_token_account, 
        token::mint = mint,
        seeds = [stake_account.key().as_ref()],
        bump,
        seeds::program = staking_program.key(),
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(address = AUTHORITY)]
    pub rent_receiver: SystemAccount<'info>,

    pub rent: Sysvar<'info, Rent>,

    pub migration_program: Program<'info, MigrationProgram>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub staking_program: Program<'info, EffectStaking>,
}

pub fn handler(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
    // check if we are dealing with an ethereum or eos account
    // ethereum accounts always have a public key length of 20 bytes, eos accounts have 32 bytes
    let is_eth = ctx.accounts.migration_account.foreign_public_key.len() == 20;
    
    // verify the claim and recover the public key
    verify_claim(
        signature,
        message,
        is_eth,
        *ctx.accounts.authority.key,
        ctx.accounts.migration_account.foreign_public_key.clone(),
    )?;

    // topup the stake account
    genesis_stake!(ctx.accounts, &[&vault_seed!(ctx.accounts.migration_account.key(), *ctx.program_id)[..]])?;

    close_vault!(
	ctx.accounts,
	migration_vault_token_account,
	&[&vault_seed!(ctx.accounts.migration_account.key(), *ctx.program_id)[..]]
    )?;

    Ok(())
}

pub fn verify_claim(signature: Vec<u8>, message: Vec<u8>, is_eth: bool, payer: Pubkey, expected_pubkey: Vec<u8>) -> Result<Vec<u8>> {
    // check if the message matches our expected message
    let expected_message = get_expected_message_bytes(&payer);
    validate_message(&message, &expected_message)?;

    // recover and validate the public key from the signature
    let recovered_pubkey = recover_and_validate_pubkey(signature, &message, is_eth)?;

    if recovered_pubkey != expected_pubkey {
        return Err(MigrationError::PublicKeyMismatch.into());
    }
    Ok(recovered_pubkey)
}

pub fn recover_and_validate_pubkey(sig: Vec<u8>, message: &[u8], is_eth: bool) -> Result<Vec<u8>> {
    let (recovery_id_bytes, signature_bytes) = split_signature(&sig, is_eth)?;
    let hashed_message = hash_message(message, is_eth);
    let recovery_id = parse_recovery_id(recovery_id_bytes, is_eth);

    let recovered_pubkey = recover_public_key(signature_bytes, hashed_message, recovery_id)?;

    if is_eth {
        Ok(ethereum_format(&recovered_pubkey.to_bytes()))
    } else {
        Ok(eos_format(&recovered_pubkey.to_bytes()))
    }
}
