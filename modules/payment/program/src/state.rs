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
    pub manager_account: Pubkey,
    pub application_account: Pubkey,
}

#[account]
pub struct RecipientManagerDataAccount {
    pub manager_account: Pubkey,
    pub application_account: Pubkey,
    pub nonce: u32,
    pub total_amount: u64,
    pub bump: u8,
    pub mint: Pubkey,
}

impl PaymentAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 32;

    pub fn initialize(
        &mut self,
        manager_authority: Pubkey,
        application_account: Pubkey,
        mint: Pubkey,
        token_account: Pubkey,
        owner: Pubkey,
    ) -> Result<()> {
        self.manager_account = manager_authority;
        self.application_account = application_account;
        self.mint = mint;
        self.token_account = token_account;
        self.owner = owner;

        Ok(())
    }

    pub fn is_authorized(&self, authority: &Pubkey) -> bool {
        self.manager_account.eq(authority)
    }
}
