use anchor_lang::prelude::*;

pub const EFFECT_VESTING: Pubkey = pubkey!("DBTKwjzLfABb1vAX2GijQ6SVDFQPJiBYyHvSXHMFzyHv");

declare_id!(EFFECT_VESTING);

#[derive(Debug, Clone)]
pub struct VestingProgram;

impl anchor_lang::Id for VestingProgram {
    fn id() -> Pubkey {
        EFFECT_VESTING
    }
}

#[account]
pub struct VestingAccount {
    pub authority: Pubkey,
    pub recipient_token_account: Pubkey,
    pub distributed_tokens: u64,
    pub release_rate: u64,
    pub start_time: i64,
    pub is_closeable: bool,
    pub is_restricted_claim: bool,
    pub tag: [u8; 1],
}

#[error_code]
pub enum VestingErrors {
    #[msg("Unauthorized")]
    Unauthorized,
}

impl VestingAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<VestingAccount>();

    pub fn init(
        &mut self,
        owner: Pubkey,
        recipient: Pubkey,
        is_closeable: bool,
        release_rate: u64,
        start_time: i64,
        tag: Option<[u8; 1]>,
    ) -> Result<()> {
        self.authority = owner;
        self.recipient_token_account = recipient;
        self.distributed_tokens = 0;
        self.is_closeable = is_closeable;
        self.release_rate = release_rate;
        self.start_time = start_time;
        self.tag = tag.unwrap_or([b'v']);
        Ok(())
    }

    pub fn claim(&mut self, amount_available: u64, now: i64) -> Result<u64> {
        let pool_amount: u64 = (now - self.start_time) as u64 * self.release_rate;
        let amount_due: u64 = pool_amount - self.distributed_tokens;
        let amount: u64 = std::cmp::min(amount_due, amount_available);

        self.distributed_tokens += amount;

        Ok(amount)
    }

    pub fn update_authority(&mut self, authority: Pubkey) -> Result<()> {
        self.authority = authority;
        Ok(())
    }

    pub fn update_recipient(&mut self, recipient: Pubkey) -> Result<()> {
        self.recipient_token_account = recipient;
        Ok(())
    }
}
