use anchor_lang::prelude::*;

/***
 * Accounts
 */

/// The `VestingAccount` struct holds all the information for any given vest.
#[account]
pub struct VestingAccount {
    pub authority: Pubkey,
    pub recipient_token_account: Pubkey,
    pub distribution_type: u8,
    pub distributed_tokens: u64,
    pub is_closeable: bool,
    pub release_rate: u64,
    pub start_time: i64,
    pub vault_token_account: Pubkey,
    pub vault_bump: u8,
}

impl VestingAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<VestingAccount>();

    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        owner: Pubkey,
        recipient: Pubkey,
        distribution_type: u8,
        is_closeable: bool,
        release_rate: u64,
        start_time: i64,
        vault_address: Pubkey,
        vault_bump: u8,
    ) -> Result<()> {
        self.authority = owner;
        self.recipient_token_account = recipient;
        self.distribution_type = distribution_type;
        self.distributed_tokens = 0;
        self.is_closeable = is_closeable;
        self.release_rate = release_rate;
        self.start_time = start_time;
        self.vault_token_account = vault_address;
        self.vault_bump = vault_bump;
        Ok(())
    }

    pub fn claim(&mut self, amount_available: u64, now: i64) -> u64 {
        let pool_amount: u64 = (now - self.start_time) as u64 * self.release_rate;
        let amount_due: u64 = pool_amount - self.distributed_tokens;
        let amount: u64 = std::cmp::min(amount_due, amount_available);

        self.distributed_tokens += amount;

        amount
    }

    pub fn update_recipient(&mut self, recipient: Pubkey) -> Result<()> {
        self.recipient_token_account = recipient;
        Ok(())
    }
}
