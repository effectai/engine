// use crate::*;
// use effect_common::accounts::{ReflectionAccount, VestingAccount};
// use anchor_spl::token::{Token, TokenAccount};
// use effect_rewards::{cpi::accounts::AddFee, program::EffectRewards};

// #[derive(Accounts)]
// pub struct ClaimFee<'info> {
//     #[account(mut, address = vesting_account.vault_token_account @ VestingErrors::InvalidTokenAccount)]
//     pub vault_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub rewards_reflection: Account<'info, ReflectionAccount>,
//     #[account(mut)]
//     pub rewards_vault: Account<'info, TokenAccount>,
//     #[account(
//         mut,
//         constraint = Clock::get()?.unix_timestamp > vesting_account.start_time @ VestingErrors::NotStarted,
//         constraint = vesting_account.distribution_type == ClaimType::AddFee as u8 @ VestingErrors::WrongClaimType,
//         constraint = vesting_account.recipient_token_account == rewards_vault.key() @ VestingErrors::WrongBeneficiary,
//     )]
//     pub vesting_account: Account<'info, VestingAccount>,
//     #[account(mut)]
//     pub authority: Signer<'info>,
//     pub token_program: Program<'info, Token>,
//     pub rewards_program: Program<'info, EffectRewards>,
// }

// impl<'info> ClaimFee<'info> {
//     pub fn handler(&mut self) -> Result<()> {
//         // determine amount
//         let amount: u64 = self
//             .vesting_account
//             .claim(self.vault_token_account.amount, Clock::get()?.unix_timestamp);

//         // stop early when there is no error
//         if amount < self.vesting_account.release_rate {
//             return Ok(());
//         }

//         transfer_fee!(self, vault_token_account, vault_token_account, seeds!(self.vesting_account), amount)
//     }
// }
