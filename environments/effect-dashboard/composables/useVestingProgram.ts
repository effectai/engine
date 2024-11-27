import { PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";

import type { Program, Idl } from "@coral-xyz/anchor";
import type { EffectVesting } from "../../../solana/target/types/effect_vesting";
import vestingIdl from "../../../solana/target/idl/effect_vesting.json";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export const useVestingProgram = () => {
	const appConfig = useRuntimeConfig();
	const { connection } = useGlobalState();
	const { publicKey, sendTransaction } = useWallet();
	const { provider } = useAnchorProvider();
	const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);
	type VestingAccount = Awaited<
		ReturnType<typeof vestingProgram.account.vestingAccount.fetch>
	>;

	const vestingProgram = new anchor.Program(
		vestingIdl as Idl,
		provider,
	) as unknown as Program<EffectVesting>;

	const useGetVestingAccounts = () => {
		return useQuery({
			queryKey: ["vestingAccounts", publicKey.value],
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

				console.log("Claiming", address.toBase58(), vestingAccount);
				console.log("recipientTokenAccount", vestingAccount.recipientTokenAccount.toBase58());
				console.log("vaultTokenAccount", vestingAccount.vaultTokenAccount.toBase58());
				console.log("authority", vestingAccount.authority.toBase58());

				return await vestingProgram.methods
					.claimTransfer()
					.accounts({
						vestingAccount: address,
						authority: publicKey.value,
						vaultTokenAccount: vestingAccount.vaultTokenAccount,
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
