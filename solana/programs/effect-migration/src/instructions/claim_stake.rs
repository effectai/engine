use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_staking::{cpi::accounts::GenesisStake, program::EffectStaking, StakeAccount};

use crate::{errors::MigrationError, utils::verify_claim, vault_seed, ClaimAccount, ClaimType};

#[derive(Accounts)]
pub struct ClaimStake<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(mut, 
        token::mint = mint,
        token::authority = authority,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub claim_account: Account<'info, ClaimAccount>,

    #[account(mut, 
        token::authority = vault_token_account, 
        token::mint = mint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut, has_one = authority)]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut, 
        token::authority = stake_vault_token_account, 
        token::mint = mint
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

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
            vault_token_account: self.stake_vault_token_account.to_account_info().clone(),
            authority: self.authority.to_account_info().clone(),
            claim_vault: self.vault_token_account.to_account_info().clone(),
            claim_account: self.claim_account.to_account_info().clone(),
            system_program: self.system_program.to_account_info().clone(),
            token_program: self.token_program.to_account_info().clone(),
            rent: self.rent.to_account_info().clone(),
        };
        CpiContext::new(self.staking_program.to_account_info().clone(), cpi_accounts)
    }
}

pub fn claim_stake(ctx: Context<ClaimStake>, signature: Vec<u8>, message: Vec<u8>) -> Result<()> {
     // return an error if the claim account is not a stake claim account
     if let ClaimType::Token { .. } = ctx.accounts.claim_account.claim_type {
        return Err(MigrationError::InvalidClaimAccount.into());
    }

    let is_eth = ctx.accounts.claim_account.foreign_public_key.len() == 20;
    
    verify_claim(
        signature,
        message,
        is_eth,
        *ctx.accounts.authority.key,
        ctx.accounts.claim_account.foreign_public_key.clone(),
    )?;

    let claim_account = &ctx.accounts.claim_account;
 
    match claim_account.claim_type {
        ClaimType::Stake { stake_start_time } => {
            if stake_start_time == 0 {
                return Err(MigrationError::InvalidClaimAccount.into());
            } else {  
                effect_staking::cpi::stake_genesis(
                    ctx.accounts
                        .into_genesis_stake_context()
                        .with_signer(&[&vault_seed!(ctx.accounts.claim_account.key(), *ctx.program_id)[..]]),
                    ctx.accounts.vault_token_account.amount,
                    stake_start_time,
                )?;
            }
        }
        _ => return Err(MigrationError::InvalidClaimAccount.into()),
    }

    Ok(())
}
