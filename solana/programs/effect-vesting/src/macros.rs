/***
 * Macros
 */

#[macro_export]
macro_rules! seeds {
    ($vesting_account: expr) => {
        &[&[
            $vesting_account.key().as_ref(),
        ][..]][..]
    };
}
