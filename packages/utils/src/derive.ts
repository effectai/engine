import { PublicKey } from "@solana/web3.js";

export const useDeriveMigrationAccounts = ({
	claimAccount,
	programId
}: {
	claimAccount: PublicKey;
	programId: PublicKey;
}) => {

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[claimAccount.toBuffer()],
		programId,
	)

    return {
		vaultAccount
    };
}

export const useDeriveVestingAccounts = ({
	vestingAccount,
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

	const [reflectionAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("reflection")],
		programId
	);

	return {
		rewardAccount,
		reflectionAccount
	};
}

export const useDeriveStakeAccounts = ({
	stakingAccount,
	programId,
}: {
	stakingAccount: PublicKey;
	programId: PublicKey;
}) => {

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[stakingAccount.toBuffer()],
		programId,
	);

	return {
		vaultAccount
	};
};