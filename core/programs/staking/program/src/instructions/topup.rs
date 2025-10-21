use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Topup<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake_account.allow_topup == true @ StakingErrors::TopupNotAllowed,
        constraint = amount > 0 @ StakingErrors::AmountNotEnough,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [stake_account.key().as_ref()],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Topup<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // get stake account and topup stake
        let new_time = Clock::get().unwrap().unix_timestamp;
        self.stake_account.topup(amount, new_time);

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, stake_vault_token_account, amount)
    }
}
