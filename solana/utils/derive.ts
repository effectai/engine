import { PublicKey } from "@solana/web3.js";

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