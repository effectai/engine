use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_staking::accounts::StakeAccount;
use effect_staking::program::EffectStaking;

use crate::effect_application::accounts::Application;

use crate::errors::PaymentErrors;
use crate::RecipientManagerDataAccount;

declare_program!(effect_staking);

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    #[account(
        mut,
        constraint = stake_account.scope == recipient_manager_data_account.application_account.key() @ PaymentErrors::InvalidStakeAccountAuthority,
        has_one = authority @ PaymentErrors::InvalidStakeAccountAuthority,
        has_one = mint @ PaymentErrors::InvalidStakeAccountMint,
    )
]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub stake_vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(address = effect_staking::ID)]
    pub staking_program: Program<'info, EffectStaking>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Redeem>) -> Result<()> {
    //log the redeem action
    msg!(
        "Redeeming stake account: {}",
        ctx.accounts.stake_account.key()
    );

    effect_staking::cpi::redeem(
        CpiContext::new(
            ctx.accounts.staking_program.to_account_info(),
            effect_staking::cpi::accounts::Redeem {
                stake_account: ctx.accounts.stake_account.to_account_info(),
                stake_vault_token_account: ctx.accounts.stake_vault_token_account.to_account_info(),
                recipient_manager_app_data_account: ctx
                    .accounts
                    .recipient_manager_data_account
                    .to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                user_token_account: ctx.accounts.user_token_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        ctx.accounts.recipient_manager_data_account.total_amount,
    )?;

    Ok(())
}
