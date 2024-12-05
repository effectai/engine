use anchor_lang::prelude::*;

use crate::VestingErrors;

#[account]
pub struct VestingAccount {
    pub authority: Pubkey,
    pub recipient_token_account: Pubkey,
    pub distributed_tokens: u64,
    pub is_closeable: bool,
    pub release_rate: u64,
    pub start_time: i64,
    pub vault_token_account: Pubkey,
    pub is_publicly_claimable: bool,
    pub tag: [u8; 8],
}

impl VestingAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<VestingAccount>();

    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        owner: Pubkey,
        recipient: Pubkey,
        is_closeable: bool,
        release_rate: u64,
        start_time: i64,
        vault_address: Pubkey,
        is_publicly_claimable: bool,
        tag: Option<[u8; 8]>,
    ) -> Result<()> {
        self.authority = owner;
        self.recipient_token_account = recipient;
        self.distributed_tokens = 0;
        self.is_closeable = is_closeable;
        self.release_rate = release_rate;
        self.start_time = start_time;
        self.vault_token_account = vault_address;
        self.is_publicly_claimable = is_publicly_claimable;
        self.tag = tag.unwrap_or([b'v', b'e', b's', b't', b'i', b'n', b'g', 0]);
        Ok(())
    }

    pub fn claim(&mut self, claimer: Pubkey, amount_available: u64, now: i64) -> Result<u64> {
        if !self.is_publicly_claimable  {
            // check if the authority is the claimer
            if self.authority.key() != claimer {
                return Err(VestingErrors::Unauthorized.into());
            }
        }

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
