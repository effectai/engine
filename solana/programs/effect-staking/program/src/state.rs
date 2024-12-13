use anchor_lang::prelude::*;

pub struct SettingsAccount {
    pub authority: Pubkey,
    pub token_account: Pubkey,
}

impl SettingsAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<SettingsAccount>();

    pub fn set(&mut self, authority: Pubkey, token_account: Pubkey) -> Result<()> {
        self.authority = authority;
        self.token_account = token_account;
        Ok(())
    }
}
