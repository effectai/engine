import { PublicKey } from "@solana/web3.js";

export const useDeriveMigrationAccounts = ({
    foreignPublicKey,
    initializer,
    mint,
    programId
}: {
    foreignPublicKey: Uint8Array;
    initializer: PublicKey;
    mint: PublicKey;
    programId: PublicKey;
}) => {

    const [stakeClaimAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake'), initializer.toBuffer(), mint.toBuffer(), Buffer.from(foreignPublicKey)],
        programId,
    );

    const [tokenClaimAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('token'), initializer.toBuffer(), mint.toBuffer(), Buffer.from(foreignPublicKey)],
        programId
    );

    const [stakeClaimVault] = PublicKey.findProgramAddressSync(
        [stakeClaimAccount.toBuffer()],
        programId
    );

    const [tokenClaimVault] = PublicKey.findProgramAddressSync(
        [tokenClaimAccount.toBuffer()],
        programId,
    );

    return {
        stakeClaimAccount,
        tokenClaimAccount,
        stakeClaimVault,
        tokenClaimVault
    };
}

export const useDeriveVestingAccounts = ({
	vestingAccount,
	authority,
	programId
}: {
	vestingAccount: PublicKey;
	authority: PublicKey;
	programId: PublicKey;
}) => {

	const [vestingVaultAccount] = PublicKey.findProgramAddressSync(
		[vestingAccount.toBuffer()],
		programId,
	);

	return {
		vestingAccount,
		vestingVaultAccount,
	};
};

export const useDeriveRewardAccounts = ({
	authority,
	programId
}: {
	programId: PublicKey;
	authority: PublicKey;
}) => {
	const [rewardAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("rewards"), authority.toBuffer()],
		programId,
	);

	return {
		rewardAccount
	};
}

export const useDeriveStakeAccounts = ({
	mint,
	authority,
	programId
}: {
	mint: PublicKey;
	authority: PublicKey;
	programId: PublicKey;
}) => {
	const [stakeAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("stake"), mint.toBuffer(), authority.toBuffer()],
		programId,
	);

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[stakeAccount.toBuffer()],
		programId,
	);

	return {
		stakeAccount,
		vaultAccount
	};
};