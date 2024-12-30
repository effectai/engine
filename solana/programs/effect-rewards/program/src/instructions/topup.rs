use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::*;

#[derive(Accounts)]
pub struct Topup<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"reflection", mint.key().as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = reward_vault_token_account,
        seeds = [ reflection_account.key().as_ref() ],
        bump,
    )]
    pub reward_vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = intermediate_reward_vault_token_account,
        seeds = [ reward_vault_token_account.key().as_ref() ],
        bump,
    )]
    pub intermediate_reward_vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Topup<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let amount: u64 = self
            .intermediate_reward_vault_token_account
            .amount
            .try_into()
            .unwrap();

        // transfer to reward vault
        transfer_tokens_from_vault!(
            self,
            intermediate_reward_vault_token_account,
            reward_vault_token_account,
            &[&intermediary_vault_seed!(self
                .reward_vault_token_account
                .key()
                .as_ref())],
            amount
        );

        self.reflection_account.topup(amount.try_into().unwrap())?;

        Ok(())
    }
}
