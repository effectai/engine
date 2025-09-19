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
    ($accounts: expr, $vault_account: ident, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.user_token_account.to_account_info(),
            $accounts.$vault_account.to_account_info(),
            $accounts.authority.to_account_info(),
            &[],
            $amount,
        )
    };
}

#[macro_export]
macro_rules! transfer_tokens_from_vault {
    ($accounts: expr, $from: ident, $to: ident, $seeds: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.$from.to_account_info(),
            $accounts.$to.to_account_info(),
            $accounts.$from.to_account_info(),
            $seeds,
            $amount,
        )
    };
}

#[macro_export]
macro_rules! close_migration_vault {
    ($accounts: expr, $vault_account: ident, $seeds: expr) => {
        cpi::close_token_account(
            $accounts.token_program.to_account_info(),
            $accounts.$vault_account.to_account_info(),
            $accounts.rent_receiver.to_account_info(),
            $accounts.$vault_account.to_account_info(),
            $seeds,
        )
    };
}

#[macro_export]
macro_rules! close_vault {
    ($accounts: expr, $vault_account: ident, $seeds: expr) => {
        cpi::close_token_account(
            $accounts.token_program.to_account_info(),
            $accounts.$vault_account.to_account_info(),
            $accounts.authority.to_account_info(),
            $accounts.$vault_account.to_account_info(),
            $seeds,
        )
    };
}

#[macro_export]
macro_rules! claim_vesting {
    ($accounts: expr, $seeds: expr) => {
        effect_vesting::cpi::claim(CpiContext::new_with_signer(
            $accounts.vesting_program.to_account_info(),
            Claim {
                vesting_account: $accounts.vesting_account.to_account_info(),
                vesting_vault_token_account: $accounts
                    .vesting_vault_token_account
                    .to_account_info(),
                authority: $accounts.claim_authority.to_account_info(),
                recipient_token_account: $accounts.reward_vault_token_account.to_account_info(),
                token_program: $accounts.token_program.to_account_info(),
            },
            $seeds,
        ))
    };
}
