use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Payment {
    pub id: [u8; 4],
    pub amount: u64,
    pub recipient_token_account: Pubkey,
    pub nonce: u32,
}

#[account]
pub struct PaymentAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub manager_authority: Pubkey,
}

#[account]
pub struct RecipientManagerDataAccount {
    pub nonce: u32,
}

impl PaymentAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 32;

    pub fn initialize(
        &mut self,
        manager_authority: Pubkey,
        mint: Pubkey,
        token_account: Pubkey,
        owner: Pubkey,
    ) -> Result<()> {
        self.manager_authority = manager_authority;
        self.mint = mint;
        self.token_account = token_account;
        self.owner = owner;

        Ok(())
    }

    pub fn is_authorized(&self, authority: &Pubkey) -> bool {
        self.manager_authority.eq(authority)
    }
}
