use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = ReflectionAccount::SIZE,
        seeds = [ "reflection".as_ref() ],
        bump
    )]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault_token_account,
        seeds = [ "vault".as_ref() ],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut, address = id::AUTHORITY)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Init<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reflection.init(self.vault_token_account.key())
    }
}
