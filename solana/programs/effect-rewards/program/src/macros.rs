#[macro_export]
macro_rules! vault_seed {
    () => {{
        let bump = Pubkey::find_program_address(&[b"vault"], &id()).1;
        [b"vault", &[bump]]
    }};
}