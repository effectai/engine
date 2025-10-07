use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_payment::accounts::RecipientManagerDataAccount;

use super::effect_payment::{self, accounts::Application};

declare_program!(effect_application);

/*
* Charge a stake account with a virtual amount
* This does not transfer any tokens, it just increases the stake amount and weighted amount
* */

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(signer)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub application_account: Account<'info, Application>,

    #[account(
        mut,
        signer,
        seeds = [application_account.key().as_ref()], 
        bump, 
        seeds::program = effect_payment::ID)
    ]
    pub application_vault_account: Account<'info, TokenAccount>,

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

impl<'info> Invest<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        self.stake_account.charge_virtual(amount)
    }
}
