use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, has_one = vault_token_account @ RewardErrors::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> AddFee<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        self.reflection.add_fee(u128::from(amount));
        transfer_tokens_to_vault!(self, amount)
    }
}
