use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_vesting::{cpi::accounts::Claim, program::EffectVesting};
use effect_vesting_common::VestingAccount;

#[derive(Accounts)]
pub struct ClaimStream<'info> {
    #[account(
        mut,
        seeds = [b"reflection", vault_token_account.mint.as_ref()],
        bump,
    )]
    pub reflection: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        seeds = [reflection.key().as_ref()],
        bump,
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut, 
        seeds = [b"vesting"],
        bump,
    )]
    /// CHECK: This is the PDA account that will be used to sign the claim
    pub claim_authority: AccountInfo<'info>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,

    pub vesting_program: Program<'info, EffectVesting>,   
}

impl<'info> ClaimStream<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let balance_before = self.vault_token_account.amount;

        let (_, bump) = Pubkey::find_program_address(&[b"vesting"], &id());
        let seeds: &[&[_]] = &[
            b"vesting",
            &[bump],
        ];
        
        claim_vesting!(
            self,
            &[seeds]
        )?;

        // CHECK:: is this method of retrieving amounts safe ?
        self.vault_token_account.reload()?;

        let balance_after = self.vault_token_account.amount;
        let claimed_amount = balance_before - balance_after;

        if claimed_amount == 0 {
            return Err(RewardErrors::NoClaimableRewards.into());
        }

        Ok(self.reflection.topup( claimed_amount as u128))
    }
}
