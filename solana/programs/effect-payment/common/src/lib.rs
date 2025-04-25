use anchor_lang::prelude::*;

pub const EFFECT_PAYMENT: Pubkey = pubkey!("effpJyVo6pe2Qmpa6SQjj7VzvJHBykXSiEdPcvTPGYM");
declare_id!(EFFECT_PAYMENT);

#[derive(Debug, Clone)]
pub struct PaymentProgram;

impl anchor_lang::Id for PaymentProgram {
    fn id() -> Pubkey {
        EFFECT_PAYMENT
    }
}

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
    pub authorities: Vec<Pubkey>,
}

#[account]
pub struct RecipientManagerDataAccount {
    pub nonce: u32,
}

impl PaymentAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 32;

    pub fn initialize(
        &mut self,
        authorities: Vec<Pubkey>,
        mint: Pubkey,
        token_account: Pubkey,
        owner: Pubkey,
    ) -> Result<()> {
        self.authorities = authorities;
        self.mint = mint;
        self.token_account = token_account;
        self.owner = owner;

        Ok(())
    }

    pub fn is_authorized(&self, authority: &Pubkey) -> bool {
        self.authorities.contains(authority)
    }
}
