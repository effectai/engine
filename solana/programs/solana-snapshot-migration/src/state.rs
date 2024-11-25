use anchor_lang::prelude::*;

#[account]
pub struct MetadataAccount {
    pub foreign_public_key: Vec<u8>,
    pub stake_start_time: i64,
}