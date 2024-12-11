use crate::{id, *};
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;
use effect_staking_common::StakeAccount;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        close = authority,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake.amount != 0 @ StakingErrors::StakeNotEmpty,
    )]
    pub stake: Account<'info, StakeAccount>,
    
    #[account(
        mut,
        seeds = [stake.key().as_ref()],
        bump,
        constraint = vault_token_account.amount == 0 @ StakingErrors::VaultNotEmpty)
    ]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        close_vault!(self, &[&vault_seed!(self.stake.key())])
    }
}
