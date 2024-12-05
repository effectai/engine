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
            $accounts.user_token_account.to_account_info(),
            $accounts.vault_token_account.to_account_info(),
            $accounts.authority.to_account_info(),
            &[],
            $amount,
        )
    };
}

#[macro_export]
macro_rules! transfer_tokens_from_claim_vault_to_vault {
    ($accounts: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.user_token_account.to_account_info(),
            $accounts.vault_token_account.to_account_info(),
            $accounts.claim_vault.to_account_info(),
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
            $accounts.vault_token_account.to_account_info(),
            $accounts.$to.to_account_info(),
            $accounts.vault_token_account.to_account_info(),
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
            $accounts.vault_token_account.to_account_info(),
            $accounts.authority.to_account_info(),
            $accounts.vault_token_account.to_account_info(),
            $seeds,
        )
    };
}

#[macro_export]
macro_rules! open_vesting {
    ($accounts: expr, $seeds: expr, $release_rate: expr, $start_time: expr, $distribution_type: expr, $is_closable:expr ) => {
        effect_vesting::cpi::open(
            CpiContext::new_with_signer(
                $accounts.vesting_program.to_account_info(),
                Open {
                    authority: $accounts.authority.to_account_info(),
                    vesting_account: $accounts.vesting_account.to_account_info(),
                    recipient_token_account: $accounts.recipient_token_account.to_account_info(),
                    vault_token_account: $accounts.vesting_vault_account.to_account_info(),
                    system_program: $accounts.system_program.to_account_info(),
                    token_program: $accounts.token_program.to_account_info(),
                    mint: $accounts.mint.to_account_info(),
                    rent: $accounts.rent.to_account_info(),
                },
                $seeds,
            ),
            $release_rate,
            $start_time,
            $distribution_type,
            $is_closable
        )
    };
}

#[macro_export]
macro_rules! transfer_fee {
    ($accounts: expr, $from: ident, $authority: ident, $seeds: expr, $amount: expr) => {
        effect_rewards::cpi::add_fee(
            CpiContext::new_with_signer(
                $accounts.rewards_program.to_account_info(),
                AddFee {
                    user_token_account: $accounts.$from.to_account_info(),
                    reflection: $accounts.rewards_reflection.to_account_info(),
                    vault_token_account: $accounts.rewards_vault.to_account_info(),
                    authority: $accounts.$authority.to_account_info(),
                    token_program: $accounts.token_program.to_account_info(),
                },
                $seeds,
            ),
            $amount,
        )
    };
}
