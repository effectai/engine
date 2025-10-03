use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum PaymentStrategy {
    Credit = 0,
    Debit = 1,
}

#[account]
pub struct Application {
    pub name: String,
    pub description: String,
    pub authority: Pubkey,
    pub payment_strategy: PaymentStrategy,
    pub bump: u8,
}
