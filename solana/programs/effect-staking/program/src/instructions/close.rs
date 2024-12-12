use crate::{id, *};
use anchor_spl::token::{Token, TokenAccount};
use effect_common::cpi;
use effect_staking_common::StakeAccount;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        close = authority,
        has_one = authority @ StakingErrors::Unauthorized,
        constraint = stake_account.amount != 0 @ StakingErrors::StakeNotEmpty,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        mut,
        seeds = [stake_account.key().as_ref()],
        bump,
        constraint = stake_vault_token_account.amount == 0 @ StakingErrors::VaultNotEmpty)
    ]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        close_vault!(self, stake_vault_token_account, &[&vault_seed!(self.stake_account.key())])
    }
}
