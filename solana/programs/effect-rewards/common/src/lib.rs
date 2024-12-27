use anchor_lang::prelude::*;

pub const EFFECT_REWARDS: Pubkey = pubkey!("DA2dSgEzNZ9vHbVwYGp4iLUfNjqBMHG7D7Vk1NdKWbSY");

declare_id!(EFFECT_REWARDS);

#[derive(Debug, Clone)]
pub struct RewardProgram;

impl anchor_lang::Id for RewardProgram {
    fn id() -> Pubkey {
        EFFECT_REWARDS
    }
}

#[account]
pub struct RewardAccount {
    pub authority: Pubkey,
    pub reflection: u128,
    pub weighted_amount: u128,
}

impl RewardAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

    pub fn init(&mut self, authority: Pubkey, reflection: u128, tokens: u128) -> Result<()> {
        self.authority = authority;
        self.reflection = reflection;
        self.weighted_amount = tokens;
        Ok(())
    }

    pub fn update(&mut self, reflection: u128, weighted_amount: u128) -> Result<()> {
        self.reflection = reflection;
        self.weighted_amount = weighted_amount;
        Ok(())
    }

    pub fn get_amount(&mut self, rate: u128) -> u128 {
        self.reflection / rate - self.weighted_amount
    }
}
