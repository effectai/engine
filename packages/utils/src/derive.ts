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
	programId,
	mint
}: {
	mint: PublicKey;
	programId: PublicKey;
}) => {
	const [reflectionAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("reflection"), mint.toBuffer()],
		programId
	);

	const [reflectionVaultAccount] = PublicKey.findProgramAddressSync(
		[reflectionAccount.toBuffer()],
		programId
	);

	return {
		reflectionAccount,
		reflectionVaultAccount
	};
}

export const useDeriveStakingRewardAccount = ({
	stakingAccount,
	programId,
}: {
	stakingAccount: PublicKey;
	programId: PublicKey;
}) => {

	const [stakingRewardAccount] = PublicKey.findProgramAddressSync(
		[stakingAccount.toBuffer()],
		programId
	);

	return {
		stakingRewardAccount,
	};
}

export const useDeriveStakeAccounts = ({
	stakingAccount,
	programId,
}: {
	stakingAccount: PublicKey;
	programId: PublicKey;
}) => {

	const [rewardAccount] = PublicKey.findProgramAddressSync(
		[stakingAccount.toBuffer()],
		programId,
	);

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[stakingAccount.toBuffer()],
		programId,
	);

	return {
		vaultAccount,
		rewardAccount,
	};
};