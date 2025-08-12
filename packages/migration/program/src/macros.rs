#[macro_export]
macro_rules! vault_seed {
    ($claim_key:expr, $program_id:expr) => {{
        let bump = Pubkey::find_program_address(&[$claim_key.as_ref()], &$program_id).1;
        [$claim_key.as_ref(), &[bump]]
    }};
}

#[macro_export]
macro_rules! genesis_stake {
    ($accounts: expr, $seeds:expr) => {
        effect_staking::cpi::stake_genesis(
            CpiContext::new_with_signer(
                $accounts.staking_program.to_account_info(),
                effect_staking::cpi::accounts::StakeGenesis {
                    mint: $accounts.mint.to_account_info(),
                    user_token_account: $accounts.recipient_token_account.to_account_info(),
                    stake_account: $accounts.stake_account.to_account_info(),
                    stake_vault_token_account: $accounts
                        .stake_vault_token_account
                        .to_account_info(),
                    authority: $accounts.authority.to_account_info(),
                    migration_vault_token_account: $accounts
                        .migration_vault_token_account
                        .to_account_info(),
                    migration_account: $accounts.migration_account.to_account_info(),
                    migration_program: $accounts.migration_program.to_account_info(),
                    system_program: $accounts.system_program.to_account_info(),
                    token_program: $accounts.token_program.to_account_info(),
                    rent: $accounts.rent.to_account_info(),
                },
                $seeds,
            ),
            $accounts.migration_vault_token_account.amount,
            $accounts.migration_account.stake_start_time,
        )
    };
}
