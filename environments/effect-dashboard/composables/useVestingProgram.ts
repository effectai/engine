import { PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { EffectVestingIdl, type EffectVesting } from "@effectai/shared";

export type EffectVestingProgramAccounts = anchor.IdlAccounts<EffectVesting>;
export type VestingAccount = anchor.ProgramAccount<
	EffectVestingProgramAccounts["vestingAccount"]
>;

export const useVestingProgram = () => {
	const appConfig = useRuntimeConfig();
	const { publicKey } = useWallet();
	const { provider } = useAnchorProvider();

	const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);

	const vestingProgram = new anchor.Program(
		EffectVestingIdl as Idl,
		provider,
	) as unknown as Program<EffectVesting>;

	const useGetVestingAccounts = () => {
		return useQuery({
			queryKey: ["vestingAccounts", publicKey.value, "unstake"],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				return await vestingProgram.account.vestingAccount.all([
					{
						memcmp: {
							offset: 8 + 32,
							encoding: "base58",
							bytes: ata.toBase58(),
						},
					},
				]);
			},
		});
	};

	const useClaim = () => {
		return useMutation({
			mutationFn: async ({
				address,
				vestingAccount,
			}: {
				vestingAccount: VestingAccount;
				address: PublicKey;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				return await vestingProgram.methods
					.claimTransfer()
					.accounts({
						vestingAccount: address,
						authority: publicKey.value,
						vaultTokenAccount: vestingAccount.account.vaultTokenAccount,
					})
					.rpc();
			},
		});
	};

	return {
		useClaim,
		useGetVestingAccounts,
		vestingProgram,
	};
};
