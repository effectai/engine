use crate::*;
use anchor_spl::token::Mint;

const ADMIN: Pubkey = pubkey!("admnVasr46cumirLqEXb5JderZEv3BMMcFnZwyK4Lo3");
const EFFECT_MINT: Pubkey = pubkey!("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E");

/// Marks that the repair has run on a pool.
#[account]
pub struct RepairMarker {}

#[derive(Accounts)]
pub struct RepairPool<'info> {
    #[account(mut, address = ADMIN @ RewardErrors::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"reflection", mint.key().as_ref()],
        bump,
    )]
    pub reflection_account: Account<'info, ReflectionAccount>,

    // `init` fails if the marker exists, so the repair can only run once.
    #[account(
        init,
        payer = admin,
        space = 8,
        seeds = [b"repair", reflection_account.key().as_ref()],
        bump,
    )]
    pub repair_marker: Account<'info, RepairMarker>,

    // only the EFFECT pool was drained
    #[account(address = EFFECT_MINT @ RewardErrors::InvalidMint)]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

impl<'info> RepairPool<'info> {
    // The EFFECT backing the added weight is sent to the reward vault in a
    // separate token transfer, so this only restores the accounting.
    pub fn handler(&mut self, reflection_gap: u128) -> Result<()> {
        require_gt!(reflection_gap, 0);

        let pool = &mut self.reflection_account;

        // restore the reflection the cross-mint claims removed from the pool
        pool.total_reflection += reflection_gap;

        // round up, so the next topup cannot raise the rate and push claims below zero
        let total_weighted_amount = pool.total_reflection.div_ceil(pool.rate);
        require_gte!(total_weighted_amount, pool.total_weighted_amount);

        pool.total_weighted_amount = total_weighted_amount;
        Ok(())
    }
}
