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

#[macro_export]
macro_rules! open_vesting {
    ($accounts: expr, $seeds: expr, $release_rate: expr, $start_time: expr, $is_closable:expr, $tag: expr ) => {
        effect_vesting::cpi::open(
            CpiContext::new_with_signer(
                $accounts.vesting_program.to_account_info(),
                Open {
                    authority: $accounts.authority.to_account_info(),
                    vesting_account: $accounts.vesting_account.to_account_info(),
                    recipient_token_account: $accounts.recipient_token_account.to_account_info(),
                    vesting_vault_token_account: $accounts.vesting_vault_token_account.to_account_info(),
                    system_program: $accounts.system_program.to_account_info(),
                    token_program: $accounts.token_program.to_account_info(),
                    mint: $accounts.mint.to_account_info(),
                    rent: $accounts.rent.to_account_info(),
                },
                $seeds,
            ),
            $release_rate,
            $start_time,
            $is_closable,
            $tag,
        )
    };
}
