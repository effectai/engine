use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    /// CHECK: This is the new authority account
    #[account(mut)]
    pub new_authority: AccountInfo<'info>,
    #[account(mut, has_one = authority @ VestingErrors::Unauthorized)]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(mut, signer)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> UpdateAuthority<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.vesting_account.update_authority(self.authority.key())
    }
}
