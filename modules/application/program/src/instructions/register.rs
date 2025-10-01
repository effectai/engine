use anchor_lang::prelude::*;

use crate::Application;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 32)]
    pub application_account: Account<'info, Application>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Register>, name: String, description: String) -> Result<()> {
    let application_account = &mut ctx.accounts.application_account;

    application_account.authority = ctx.accounts.authority.key();
    application_account.name = name;
    application_account.description = description;

    Ok(())
}
