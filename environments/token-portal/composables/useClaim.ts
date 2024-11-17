import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import { deriveMetadataAndVaultFromPublicKey } from "../../../solana/utils/keys";
import { useMutation } from "@tanstack/vue-query";

const signature = ref<Uint8Array | null>(null);
const message = ref<Uint8Array | null>(null);
const publicKey = ref<Uint8Array | null>(null);

export const useClaim = () => {
	const config = useRuntimeConfig();
	const txHash = ref<string | null>(null);

	const clear = () => {
		signature.value = null;
		message.value = null;
		publicKey.value = null;
	}

	const set = (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array) => {
		signature.value = sig;
		message.value = msg;
		publicKey.value = pk;
	}

	const canClaim = computed(() => {
		return signature.value && message.value && publicKey.value;
	})

	const mutation = useMutation({
		mutationFn: async ({
			signature,
			message,
			foreignPublicKey,
		}: {
			signature: Uint8Array;
			message: Uint8Array;
			foreignPublicKey: Uint8Array;
		}) => {
			const { program } = useAnchorWorkspace();
			const { publicKey } = useWallet();

			if (!publicKey.value) {
				throw new Error("No public key");
			}

			const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
			const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

			const { metadata, vault } = deriveMetadataAndVaultFromPublicKey(
				// TODO:: change hardcoded intiializer
				new PublicKey("CW7MQAmZaWvDqUhcxs8y14rnttTiTYHELpm63REnKr4J"),
				foreignPublicKey,
				program.programId,
			);

			return await program.methods
				.claim(Buffer.from(signature), Buffer.from(message))
				.accounts({
					payer: publicKey.value,
					recipientTokens: ata,
					metadataAccount: metadata,
					vaultAccount: vault,
				})
				.rpc();
		},
	});

	return { txHash, signature, message, publicKey, claim: mutation.mutateAsync, clear, set, canClaim };
};
