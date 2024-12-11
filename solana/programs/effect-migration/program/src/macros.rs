#[macro_export]
macro_rules! vault_seed {
    ($claim_key:expr, $program_id:expr) => {{
        let bump = Pubkey::find_program_address(&[$claim_key.as_ref()], &$program_id).1;
        [$claim_key.as_ref(), &[bump]]
    }};
}

#[macro_export]
macro_rules! base_account_fields {
    () => {
        #[account(mut)]
        pub payer: Signer<'info>,

        pub mint: Account<'info, Mint>,

        #[account(
            mut,
            token::mint = mint,
        )]
        pub payer_tokens: Account<'info, TokenAccount>,

        pub system_program: Program<'info, System>,
        pub token_program: Program<'info, Token>,
        pub rent: Sysvar<'info, Rent>,
    };
}
