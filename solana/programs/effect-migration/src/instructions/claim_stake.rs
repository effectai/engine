use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::constants::{self, SECONDS_PER_DAY};
use effect_staking::{cpi::accounts::GenesisStake, program::EffectStaking};

use crate::{errors::MigrationError, utils::verify_claim, vault_seed, ClaimStakeAccount};

#[derive(Accounts)]
pub struct ClaimStake<'info> {
    #[account(signer)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub claim_account: Account<'info, ClaimStakeAccount>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,

    /// CHECK: checked in ix body
    #[account(mut)]
    pub stake_account: UncheckedAccount<'info>,

    /// CHECK: checked in ix body
    #[account(mut)]
    pub stake_vault_account: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub staking_program: Program<'info, EffectStaking>,
}

impl<'info> ClaimStake<'info> {
    fn into_genesis_stake_context(&self) -> CpiContext<'_, '_, '_, 'info, GenesisStake<'info>> {
        let cpi_accounts = GenesisStake {
            mint: self.mint.to_account_info().clone(),
            user_token_account: self.recipient_token_account.to_account_info().clone(),
            stake: self.stake_account.to_account_info().clone(),
            vault_token_account: self.stake_vault_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
            claim_vault: self.vault_account.to_account_info().clone(),
            metadata: self.claim_account.to_account_info().clone(),
            system_program: self.system_program.to_account_info().clone(),
            token_program: self.token_program.to_account_info().clone(),
            rent: self.rent.to_account_info().clone(),
        };
        CpiContext::new(self.staking_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn claim_stake(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
    let is_eth = ctx.accounts.claim_account.foreign_public_key.len() == 20;
    
    verify_claim(
        signature,
        message,
        is_eth,
        *ctx.accounts.payer.key,
        ctx.accounts.claim_account.foreign_public_key.clone(),
    )?;

    let claim_account = &ctx.accounts.claim_account;
 
    if claim_account.stake_start_time != 0 {
        effect_staking::cpi::stake_genesis(
            ctx.accounts
                .into_genesis_stake_context()
                .with_signer(&[&vault_seed!(ctx.accounts.claim_account.key(), *ctx.program_id)[..]]),
            ctx.accounts.vault_account.amount,
            constants::STAKE_DURATION_MIN,
            claim_account.stake_start_time,
        )?;
    } else {
        return Err(MigrationError::InvalidMetadataAccount.into());
    }

    Ok(())
}
