import { useAnchorWallet, useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import programIDL from "../../../solana/target/idl/effect_staking.json";
import type { EffectStaking } from "../../../solana/target/types/effect_staking";
import { useMutation } from "@tanstack/vue-query";
import {
	createStakeTransaction,
	createStakeClient,
	createStakingConfig,
} from "@effectai/staking";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProvider } from "./useAnchorProvider";

export function useStakingProgram() {
	const appConfig = useRuntimeConfig();
	const { connection } = useGlobalState();
	const { publicKey, sendTransaction } = useWallet();
    
	const stakeConfig = createStakingConfig(
		connection,
		new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT),
	);

    const { provider } = useAnchorProvider()

	const program = new anchor.Program(
		programIDL as Idl,
		provider,
	) as unknown as Program<EffectStaking>;

	const stakeClient = createStakeClient(stakeConfig, program);

	const useStake = () =>
		useMutation({
			mutationFn: async ({
				amount,
				unstakeDays,
			}: {
				amount: number;
				unstakeDays: number;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const transaction = await createStakeTransaction({
					client: stakeClient,
					userAddress: publicKey.value,
					unstakeDays,
					amount,
				});

				return await sendTransaction(transaction, connection);
			},
		});

	const extendStakeMutation = async () =>
		useMutation({
			mutationFn: async (extraUnstakeDays: number) => {},
		});

	return {
		program,
        useStake
        
	};
}
