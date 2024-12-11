use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_vesting_common::VestingAccount;

#[derive(Accounts)]
pub struct UpdateRecipientTokenAccount<'info> {
    #[account(token::authority = authority.key())]
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(token::mint = recipient_token_account.mint)]
    pub new_recipient_token_account: Account<'info, TokenAccount>,
    #[account(mut, has_one = recipient_token_account @ VestingErrors::WrongBeneficiary)]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> UpdateRecipientTokenAccount<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.vesting_account.update_recipient(self.new_recipient_token_account.key())
    }
}
