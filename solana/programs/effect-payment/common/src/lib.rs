use anchor_lang::prelude::*;


declare_id!(EFFECT_PAYMENT);

#[derive(Debug, Clone)]
pub struct PaymentProgram;

impl anchor_lang::Id for PaymentProgram {
    fn id() -> Pubkey {
       EFFECT_PAYMENT 
    }
}

