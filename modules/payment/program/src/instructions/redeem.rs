use anchor_lang::{prelude::*, solana_program::keccak};
use anchor_spl::token::{Mint, Token, TokenAccount};
use effect_staking::accounts::StakeAccount;
use effect_staking::program::EffectStaking;

use crate::errors::PaymentErrors;
use crate::RecipientManagerDataAccount;

declare_program!(effect_staking);

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub recipient_manager_data_account: Account<'info, RecipientManagerDataAccount>,

    #[account(mut)]
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
    let stake_account = &mut ctx.accounts.stake_account;

    //ensure stake account authority is the recipient_manager_data_account
    require_keys_eq!(
        stake_account.authority,
        ctx.accounts.recipient_manager_data_account.key(),
        PaymentErrors::InvalidStakeAccountAuthority
    );

    effect_staking::cpi::redeem(
        CpiContext::new_with_signer(
            ctx.accounts.staking_program.to_account_info(),
            effect_staking::cpi::accounts::Redeem {
                stake_account: ctx.accounts.stake_account.to_account_info(),
                stake_vault_token_account: ctx.accounts.stake_vault_token_account.to_account_info(),
                authority: ctx
                    .accounts
                    .recipient_manager_data_account
                    .to_account_info(),
                user_token_account: ctx.accounts.user_token_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            &[&[
                ctx.accounts.authority.key().as_ref(),
                ctx.accounts
                    .recipient_manager_data_account
                    .manager_account
                    .as_ref(),
                ctx.accounts
                    .recipient_manager_data_account
                    .application_account
                    .as_ref(),
                ctx.accounts.mint.key().as_ref(),
                &[ctx.accounts.recipient_manager_data_account.bump],
            ]],
        ),
        ctx.accounts.recipient_manager_data_account.total_amount,
    )?;

    Ok(())
}
