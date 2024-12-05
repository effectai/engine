use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;
use effect_vesting::cpi::accounts::Claim;
use effect_vesting::{program::EffectVesting, VestingAccount};

#[derive(Accounts)]
pub struct ClaimStream<'info> {
    #[account(mut, has_one = vault_token_account @ RewardErrors::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vesting_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vesting_account: Account<'info, VestingAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,

    pub vesting_program: Program<'info, EffectVesting>,   
}

impl<'info> ClaimStream<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let balance_before = self.vault_token_account.amount;
        claim_vesting!(self, &[&[b"vesting"]]);
        let balance_after = self.vault_token_account.amount;
        // update reflection account
        Ok(self.reflection.topup( balance_after as u128 - balance_before as u128 ))
    }
}
