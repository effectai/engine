use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Open<'info> {
    #[account(
        init, 
        payer = authority, 
        space = VestingAccount::SIZE,
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vesting_vault_token_account,
        seeds = [ vesting_account.key().as_ref() ],
        bump,
    )]
    pub vesting_vault_token_account: Account<'info, TokenAccount>,
    
    #[account(token::mint = mint)]
    pub recipient_token_account: Account<'info, TokenAccount>,
   
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Open<'info> {
    pub fn handler(
        &mut self,
        emission: u64,
        start_time: i64,
        closeable: bool,
        tag: Option<[u8; 1]>,
    ) -> Result<()> {
        self.vesting_account.init(
            self.authority.key(),
            self.recipient_token_account.key(),
            closeable,
            emission,
            start_time,
            tag,
        )
    }
}
