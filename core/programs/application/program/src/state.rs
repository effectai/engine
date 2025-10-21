use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum PayoutStrategy {
    Shares = 0,
    Direct = 1,
    Staked = 2,
}

#[account]
pub struct Application {
    pub name: String,
    pub description: String,
    pub authority: Pubkey,
    pub payment_strategy: PayoutStrategy,
    pub bump: u8,
}
