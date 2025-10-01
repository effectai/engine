use anchor_lang::prelude::*;

#[account]
pub struct Application {
    pub name: String,
    pub description: String,
    pub authority: Pubkey,
    pub bump: u8,
}
