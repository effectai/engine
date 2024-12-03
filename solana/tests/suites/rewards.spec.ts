import { describe, it } from "vitest";
import { useAnchor } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import { setup } from "../../utils/spl.js";
import { createKeypairFromFile } from "@effectai/utils";
const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Effect Reward Program", async () => {
	const program = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();

	describe("Reward Initialize", async () => {
		it.concurrent("should correctly initialize a reflection", async () => {
			const { mint, ata } = await setup({ provider, payer });

			const signer = await createKeypairFromFile(
				"./tests/keys/devEs8EACCACJqJxJb2jBTRVsmrtsPobvJvMpD33mht.json",
			);

			// airdrop signer
			const signature = await provider.connection.requestAirdrop(signer.publicKey, 1_000_000_000);

            // wait for airdrop to complete
            await provider.connection.confirmTransaction(signature, 'confirmed');

			await program.methods
				.init()
				.accounts({
					mint,
				})
				.signers([signer])
				.rpc();
		});
	});
});
