use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::cpi;

#[derive(Accounts)]
#[instruction(amount: u64, duration: u128, scope: Pubkey)]
pub struct Stake<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = authority.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<StakeAccount>(),
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = stake_vault_token_account,
        seeds = [ stake_account.key().as_ref() ],
        bump,
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Stake<'info> {
    pub fn handler(
        &mut self,
        amount: u64,
        duration: u128,
        scope: Pubkey,
        allow_topup: bool,
    ) -> Result<()> {
        // get stake account and init stake
        self.stake_account.init(
            amount,
            self.authority.key(),
            duration.try_into().unwrap(),
            Clock::get().unwrap().unix_timestamp,
            self.mint.key(),
            scope,
            allow_topup,
        );

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, stake_vault_token_account, amount)
    }
}
