// use crate::*;
// use anchor_spl::token::{Token, TokenAccount};
// use effect_common::cpi;
// use effect_common::accounts::StakeAccount;

// #[derive(Accounts)]
// pub struct Withdraw<'info> {
//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,
//     #[account(mut, constraint = vault_token_account.amount != 0 @ EffectError::VaultEmpty)]
//     pub vault_token_account: Account<'info, TokenAccount>,
//     #[account(
//         mut,
//         has_one = vault_token_account @ EffectError::InvalidVault,
//         has_one = authority @ EffectError::Unauthorized,
//         constraint = stake.time_unstake != 0 @ EffectStakingError::NotUnstaked,
//     )]
//     pub stake: Account<'info, StakeAccount>,
//     #[account(mut)]
//     pub authority: Signer<'info>,
//     pub token_program: Program<'info, Token>,
// }

// impl<'info> Withdraw<'info> {
//     pub fn handler(&self) -> Result<()> {
//         let amount: u64 = self
//             .stake
//             .withdraw(self.vault_token_account.amount, Clock::get()?.unix_timestamp);
//         if amount > 0 {
//             transfer_tokens_from_vault!(self, user_token_account, seeds!(self.stake, &[self.stake.vault_bump]), amount)
//         } else {
//             Ok(())
//         }
//     }
// }
