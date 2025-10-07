use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::id::ADMIN_AUTHORITY;

#[derive(Accounts)]
#[instruction(settings: ReflectionSettings)]
pub struct Init<'info> {
    #[account(
        init,
        payer = authority,
        space = ReflectionAccount::SIZE,
        seeds = [ b"reflection", mint.key().as_ref(), settings.scope.as_ref() ],
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

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = intermediate_reward_vault_token_account,
        seeds = [ reward_vault_token_account.key().as_ref() ],
        bump,
    )]
    pub intermediate_reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        constraint = mint.key() == settings.mint @ RewardErrors::ReflectionInvalid,
    )]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Init<'info> {
    pub fn handler(&mut self, settings: ReflectionSettings) -> Result<()> {
        // for now only the admin authority can create a reflection pool for the mint itself (global pools)
        if settings.scope == settings.mint && self.authority.key() != ADMIN_AUTHORITY {
            return Err(RewardErrors::ReflectionInvalid.into());
        }

        self.reflection_account.init(self.mint.supply, settings)
    }
}
