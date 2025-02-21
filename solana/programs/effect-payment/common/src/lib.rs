use anchor_lang::prelude::*;

pub const EFFECT_PAYMENT: Pubkey = pubkey!("");

declare_id!(EFFECT_PAYMENT);

#[derive(Debug, Clone)]
pub struct PaymentProgram;

impl anchor_lang::Id for PaymentProgram {
    fn id() -> Pubkey {
       EFFECT_PAYMENT 
    }
}

