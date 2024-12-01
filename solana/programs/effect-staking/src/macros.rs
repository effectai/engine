/***
 * Macros
 */
 #[macro_export]
 macro_rules! vault_seed {
     ($stake_key:expr) => {{
         let bump = Pubkey::find_program_address(&[$stake_key.as_ref()], &id()).1;
         &[$stake_key.as_ref(), &[bump]][..]
     }};
 }