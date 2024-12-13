use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init,
        payer = authority,
        space = ReflectionAccount::SIZE,
        seeds = [ b"reflection", mint.key().as_ref() ],
        bump
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = reward_vault_token_account,
        seeds = [ reflection_account.key().as_ref() ],
        bump,
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Init<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reflection_account.init()
    }
}
