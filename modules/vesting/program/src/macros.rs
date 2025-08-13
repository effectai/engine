/***
 * Macros
 */

#[macro_export]
macro_rules! seeds {
    ($vesting_key: expr) => {{
        let bump = Pubkey::find_program_address(&[$vesting_key.as_ref()], &id()).1;
        &[$vesting_key.as_ref(), &[bump]][..]
    }};
}
