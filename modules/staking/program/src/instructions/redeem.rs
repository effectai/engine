use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_payment::accounts::RecipientManagerDataAccount;

declare_program!(effect_payment);

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(signer)]
    pub authority: Account<'info, RecipientManagerDataAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [stake_account.key().as_ref()],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Redeem<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, StakingErrors::AmountNotEnough);

        self.stake_account.amount += amount;
        self.stake_account.weighted_amount += amount as u128;

        Ok(())
    }
}
