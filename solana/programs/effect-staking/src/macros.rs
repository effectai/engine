/***
 * Macros
 */

#[macro_export]
macro_rules! seeds {
    ($stake: expr, $vault: expr) => {
        &[&[
            $stake.key().as_ref(),
            &[$stake.vault_bump],
        ][..]][..]
    };
}