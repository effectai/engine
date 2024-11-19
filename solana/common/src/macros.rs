/***
 * Macros
 */

#[macro_export]
macro_rules! security_txt {
    ($($name:ident: $value:expr),*) => {
        #[cfg_attr(target_arch = "bpf", link_section = ".security.txt")]
        #[allow(dead_code)]
        #[no_mangle]
        pub static security_txt: &str = concat! {
            "=======BEGIN SECURITY.TXT V1=======\0",
            $(stringify!($name), "\0", $value, "\0",)*
            "=======END SECURITY.TXT V1=======\0"
        };
    };
}

#[macro_export]
macro_rules! transfer_tokens_to_vault {
    ($accounts: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.user.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.authority.to_account_info(),
            &[],
            $amount,
        )
    };
}

#[macro_export]
macro_rules! transfer_tokens_from_vault {
    ($accounts: expr, $to: ident, $seeds: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.$to.to_account_info(),
            $accounts.vault.to_account_info(),
            $seeds,
            $amount,
        )
    };
}

#[macro_export]
macro_rules! close_vault {
    ($accounts: expr, $seeds: expr) => {
        cpi::close_token_account(
            $accounts.token_program.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.authority.to_account_info(),
            $accounts.vault.to_account_info(),
            $seeds,
        )
    };
}
