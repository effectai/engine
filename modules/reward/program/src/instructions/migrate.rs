use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_common::id::ADMIN_AUTHORITY;

#[derive(Accounts)]
#[instruction(scope: Pubkey)]
pub struct Migrate<'info> {
    #[account(
        mut,
        realloc = 8 + std::mem::size_of::<ReflectionAccount>(),
        realloc::payer = authority,
        realloc::zero = true,
        seeds = [ b"reflection", mint.key().as_ref() ],
        bump
    )]
    pub old_reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = old_reward_vault_token_account,
        seeds = [ old_reflection_account.key().as_ref() ],
        bump,
    )]
    pub old_reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [ b"reflection", mint.key().as_ref(), scope.as_ref() ],
        bump,
    )]
    pub new_reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = new_reward_vault_token_account,
        seeds = [ new_reflection_account.key().as_ref() ],
        bump,
    )]
    pub new_reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut, address = ADMIN_AUTHORITY)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Migrate<'info> {
    pub fn handler(&mut self, scope: Pubkey) -> Result<()> {
        //only allow migration on v0 reflection accounts
        require!(
            self.old_reflection_account.version == 0,
            RewardErrors::AlreadyMigrated
        );

        //migrate old reflection account to new reflection account
        self.new_reflection_account.rate = self.old_reflection_account.rate;
        self.new_reflection_account.total_reflection = self.old_reflection_account.total_reflection;
        self.new_reflection_account.total_weighted_amount =
            self.old_reflection_account.total_weighted_amount;

        //transfer tokens from old vault to new vault
        transfer_tokens_from_vault!(
            self,
            old_reward_vault_token_account,
            new_reward_vault_token_account,
            &[&vault_seed!(self.old_reflection_account.key().as_ref())],
            self.old_reward_vault_token_account.amount
        )
    }
}
