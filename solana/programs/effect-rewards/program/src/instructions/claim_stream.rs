use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_vesting::{cpi::accounts::Claim, program::EffectVesting};
use effect_vesting_common::VestingAccount;

#[derive(Accounts)]
pub struct ClaimStream<'info> {
    #[account(
        mut,
        seeds = [b"reflection", vesting_vault_token_account.mint.as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        seeds = [reflection_account.key().as_ref()],
        bump,
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        mut, 
        seeds = [vesting_account.key().as_ref()],
        bump,
        seeds::program = vesting_program.key(),
    )]
    pub vesting_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vesting"],
        bump,
    )]
    pub claim_authority: SystemAccount<'info>,

    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub vesting_program: Program<'info, EffectVesting>,   
}

impl<'info> ClaimStream<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let (_, bump) = Pubkey::find_program_address(&[b"vesting"], &id());
        
        let seeds: &[&[_]] = &[
            b"vesting",
            &[bump],
        ];
        
        let balance_before_claim = self.vesting_vault_token_account.amount;

        claim_vesting!(
            self,
            &[seeds]
        )?;

        self.vesting_vault_token_account.reload()?;
        let claimed_amount = balance_before_claim - self.vesting_vault_token_account.amount;

        if claimed_amount == 0 {
            return Err(RewardErrors::NoClaimableRewards.into());
        }

        Ok(self.reflection_account.topup( claimed_amount as u128))
    }
}
