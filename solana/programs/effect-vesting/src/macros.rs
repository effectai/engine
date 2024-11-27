/***
 * Macros
 */

#[macro_export]
macro_rules! seeds {
    ($pool: expr) => {
        &[&[
            $pool.key().as_ref(),
            &[$pool.vault_bump],
        ][..]][..]
    };
}
