use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_payment::accounts::RecipientManagerDataAccount;

declare_program!(effect_payment);

/*
* Charge a stake account with a virtual amount
* This does not transfer any tokens, it just increases the stake amount and weighted amount
* */

#[derive(Accounts)]
pub struct Charge<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut, signer)]
    pub recipient_manager_app_data_account: Account<'info, RecipientManagerDataAccount>,

    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake_account.scope == recipient_manager_app_data_account.application_account.key() @ StakingErrors::Unauthorized,
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

impl<'info> Charge<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, StakingErrors::AmountNotEnough);

        self.stake_account.amount += self.recipient_manager_app_data_account.total_claimed;
        self.stake_account.weighted_amount += amount as u128;

        Ok(())
    }
}
