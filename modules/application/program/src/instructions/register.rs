use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::{
    effect_reward::{self, types::ReflectionSettings},
    Application, PayoutStrategy,
};

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 32)]
    pub application_account: Account<'info, Application>,

    /// CHECK:
    #[account(
        mut,
        seeds = [b"reflection", mint.key().as_ref(), application_account.key().as_ref()],
        seeds::program = effect_reward::ID,
        bump
    )]
    pub reflection_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [reflection_account.key().as_ref()],
        seeds::program = effect_reward::ID,
        bump
    )]
    pub reward_vault_token_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [reward_vault_token_account.key().as_ref()],
        seeds::program = effect_reward::ID,
        bump
    )]
    pub intermediate_reward_vault_token_account: UncheckedAccount<'info>,

    pub effect_reward_program: Program<'info, effect_reward::program::EffectReward>,

    pub rent: Sysvar<'info, Rent>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

pub fn handler(
    ctx: Context<Register>,
    name: String,
    description: String,
    payout_strategy: PayoutStrategy,
) -> Result<()> {
    let application_account = &mut ctx.accounts.application_account;

    application_account.authority = ctx.accounts.authority.key();
    application_account.name = name;
    application_account.description = description;
    application_account.payment_strategy = payout_strategy;

    //initialize application contribution pool
    effect_reward::cpi::init(
        CpiContext::new(
            ctx.accounts.effect_reward_program.to_account_info(),
            effect_reward::cpi::accounts::Init {
                authority: ctx.accounts.authority.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                reward_vault_token_account: ctx
                    .accounts
                    .reward_vault_token_account
                    .to_account_info(),
                intermediate_reward_vault_token_account: ctx
                    .accounts
                    .intermediate_reward_vault_token_account
                    .to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                reflection_account: ctx.accounts.reflection_account.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ),
        ReflectionSettings {
            lock_duration: 0,
            mint: ctx.accounts.mint.key(),
            scope: ctx.accounts.application_account.key(),
            _reserved: [0; 128],
        },
    )?;

    Ok(())
}
