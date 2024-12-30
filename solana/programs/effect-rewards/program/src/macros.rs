#[macro_export]
macro_rules! vault_seed {
    ($reflection_key:expr) => {{
        let bump = Pubkey::find_program_address(&[$reflection_key], &id()).1;
        &[$reflection_key.as_ref(), &[bump]][..]
    }};
}

#[macro_export]
macro_rules! intermediary_vault_seed {
    ($reflection_vault_key:expr) => {{
        let bump = Pubkey::find_program_address(&[$reflection_vault_key], &id()).1;
        &[$reflection_vault_key.as_ref(), &[bump]][..]
    }};
}
