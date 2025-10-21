use crate::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct Migrate<'info> {
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        realloc = std::mem::size_of::<StakeAccount>(),
        realloc::payer = authority,
        has_one = authority,
        realloc::zero = true
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        seeds = [stake_account.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = stake_vault_token_account 
    )]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}


impl<'info> Migrate<'info> {
    pub fn handler(
        &mut self,
    ) -> Result<()> {
        require!(self.stake_account.version == 0, StakingErrors::AlreadyMigrated);

        // Migrate the stake account
        self.stake_account.migrate(self.mint.key());

        Ok(())

    }
}
