use anchor_lang::prelude::*;

/***
 * Accounts
 */

/// The `PoolAccount` struct holds all the information for any given pool.
#[account]
pub struct PoolAccount {
    pub authority: Pubkey,
    pub beneficiary: Pubkey,
    pub claim_type: u8,
    pub claimed_tokens: u64,
    pub closeable: bool,
    pub emission: u64,
    pub start_time: i64,
    pub vault: Pubkey,
    pub vault_bump: u8,
}

impl PoolAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<PoolAccount>();

    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        authority: Pubkey,
        beneficiary: Pubkey,
        claim_type: u8,
        closeable: bool,
        emission: u64,
        start_time: i64,
        vault: Pubkey,
        vault_bump: u8,
    ) -> Result<()> {
        self.authority = authority;
        self.beneficiary = beneficiary;
        self.claim_type = claim_type;
        self.claimed_tokens = 0;
        self.closeable = closeable;
        self.emission = emission;
        self.start_time = start_time;
        self.vault = vault;
        self.vault_bump = vault_bump;
        Ok(())
    }

    pub fn claim(&mut self, amount_available: u64, now: i64) -> u64 {
        let pool_amount: u64 = (now - self.start_time) as u64 * self.emission;
        let amount_due: u64 = pool_amount - self.claimed_tokens;
        let amount: u64 = std::cmp::min(amount_due, amount_available);

        self.claimed_tokens += amount;

        amount
    }

    pub fn update_beneficiary(&mut self, beneficiary: Pubkey) -> Result<()> {
        self.beneficiary = beneficiary;
        Ok(())
    }
}
