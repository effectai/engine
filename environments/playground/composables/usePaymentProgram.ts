import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type {
	Program,
	Idl,
	ProgramAccount,
	IdlAccounts,
} from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAnchorProvider } from "./useAnchorProvider";
import {
	ComputeBudgetProgram,
	Keypair,
	PublicKey,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	EffectPaymentIdl,
	type EffectPayment,
	type EffectStaking,
} from "@effectai/shared";

import { buildEddsa } from "circomlibjs";

import {
	createAssociatedTokenAccountIdempotent,
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { Payment, ProofResponse } from "@effectai/protocol";

const SECONDS_PER_DAY = 86400;

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
	EffectStakingProgramAccounts["stakeAccount"]
>;

export function usePaymentProgram() {
	const { connection, mint } = useGlobalState();
	const { provider } = useAnchorProvider();

	const paymentProgram = computed(() => {
		return new anchor.Program(
			EffectPaymentIdl as Idl,
			provider.value || undefined,
		) as unknown as Program<EffectPayment>;
	});

	// const queryClient = useQueryClient();

	const init = () =>
		useMutation({
			onSuccess: () => {},
			mutationFn: async ({}: {}) => {
				console.log("init");
			},
		});

	const claim = () =>
		useMutation({
			onSuccess: () => {},
			mutationFn: async ({ proof }: { proof: ProofResponse }) => {
				const { publicKey } = useWallet();

				if (!proof.signals) {
					throw new Error("No proof provided");
				}

				if (!publicKey.value) {
					throw new Error("No public key found");
				}

				const eddsa = await buildEddsa();
				const { workerPublicKey, managerPublicKey } = useWorkerNode();

				const mngpubkey = new PublicKey(
					eddsa.F.toObject(new Uint8Array(proof.R8?.R8_1)),
				);

				const managerRecipientDataAccount = deriveWorkerManagerDataAccount(
					publicKey.value,
					mngpubkey,
				);

				if (!workerPublicKey.value) {
					throw new Error("No worker public key found");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const dataAccount =
					await paymentProgram.value.account.recipientManagerDataAccount.fetch(
						managerRecipientDataAccount,
					);

				console.log("dataAccount:", dataAccount);
				console.log("min_nonce", proof.signals?.minNonce);
				console.log("max_nonce", proof.signals?.maxNonce);
				console.log("amount", proof.signals?.amount.toString());

				const tx = await paymentProgram.value.methods
					.claim(
						new anchor.BN(proof.signals?.minNonce),
						new anchor.BN(proof.signals?.maxNonce),
						new anchor.BN(proof.signals?.amount.toString()),
						bigIntToBytes32(eddsa.F.toObject(proof.R8?.R8_1)),
						bigIntToBytes32(eddsa.F.toObject(proof.R8?.R8_2)),
						Array.from(convertProofToBytes(proof)),
					)
					.accounts({
						recipientManagerDataAccount: managerRecipientDataAccount,
						paymentAccount: new PublicKey(
							"7XMNp4NqBDQ8o6Pj2FGAwnuNFdonnVyY2vdzMhgPRQBz",
						),
						mint,
						recipientTokenAccount: ata,
					})
					.preInstructions([
						...((await connection.value.getAccountInfo(ata))
							? []
							: [
									createAssociatedTokenAccountIdempotentInstructionWithDerivation(
										publicKey.value,
										publicKey.value,
										mint,
									),
								]),

						// Initialize the manager recipient data account if it doesn't exist
						...((await connection.value.getAccountInfo(
							managerRecipientDataAccount,
						))
							? []
							: [
									await paymentProgram.value.methods
										.init(new PublicKey(eddsa.F.toObject(proof.R8?.R8_1)))
										.accounts({
											mint,
										})
										.instruction(),
								]),
					])
					.rpc();

				console.log("tx:", tx);
			},
		});

	const deriveWorkerManagerDataAccount = (
		worker: PublicKey,
		manager: PublicKey,
	) => {
		const [publicKey] = PublicKey.findProgramAddressSync(
			[worker.toBuffer(), manager.toBuffer()],
			paymentProgram.value.programId,
		);

		return publicKey;
	};

	const fetchRemoteNonce = async (
		workerPublicKey: PublicKey,
		managerPublicKey: PublicKey,
	) => {
		const managerDataAccount = deriveWorkerManagerDataAccount(
			workerPublicKey,
			managerPublicKey,
		);

		const result =
			await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
				managerDataAccount,
			);

		return result ? BigInt(result.nonce) : 0n;
	};

	return {
		program: paymentProgram,
		claim,
		init,

		fetchRemoteNonce,
		deriveWorkerManagerDataAccount,
	};
}
