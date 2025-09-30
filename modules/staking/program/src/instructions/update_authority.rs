use crate::*;
use anchor_spl::token::Token;

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    /// CHECK::
    pub new_authority: AccountInfo<'info>,

    #[account(mut, signer)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority @ StakingErrors::Unauthorized)]
    pub staking_account: Account<'info, StakeAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> UpdateAuthority<'info> {
    pub fn handler(&mut self) -> Result<()> {
        require!(
            //TODO:: do we want to allow authority change when stake is not empty?
            self.staking_account.amount == 0,
            StakingErrors::StakeNotEmpty
        );

        self.staking_account.authority = self.new_authority.key();

        Ok(())
    }
}
