import type { PeerId, PeerStore, PrivateKey } from "@libp2p/interface";
import type { PaymentStore } from "../../stores/paymentStore.js";
import { PublicKey } from "@solana/web3.js";
import { Payment, ProofRequest } from "../../common/index.js";
import { int2hex, signPayment } from "../../utils/payment.js";
import { buildEddsa } from "circomlibjs";
import { fileURLToPath } from "node:url";
import * as snarkjs from "snarkjs";
import path from "node:path";
import {
	getNonce,
	getRecipient,
	getSessionData,
	updateNonce,
} from "../utils.js";
import { computePaymentId } from "../../core/utils.js";

export function createPaymentManager({
	paymentStore,
	privateKey,
	peerStore,
}: {
	peerStore: PeerStore;
	privateKey: PrivateKey;
	paymentStore: PaymentStore;
}) {
	const generatePayout = async ({
		peerId,
	}: {
		peerId: PeerId;
	}) => {
		const peer = await peerStore.get(peerId);

		if (!peer) {
			throw new Error("Worker not found");
		}

		const { lastPayoutTimestamp } = await getSessionData(peer);
		const currentTime = Math.floor(Date.now() / 1000);

		const payment = await generatePayment({
			peerId,
			amount: BigInt(currentTime - lastPayoutTimestamp),
			paymentAccount: new PublicKey(
				"8Ex7XokfTdr1MAMZXgN3e5eQWJ6H9u5KbnPC8CLcYgH5",
			),
		});

		//update last payout time
		await peerStore.merge(peerId, {
			metadata: {
				"session:lastPayout": new TextEncoder().encode(currentTime.toString()),
			},
		});

		//insert payment into the store
		await paymentStore.put({
			entityId: computePaymentId(payment),
			record: { state: payment },
		});

		return payment;
	};

	const generatePaymentProof = async (
		privateKey: PrivateKey,
		payments: ProofRequest.PaymentProof[],
	) => {
		try {
			//sort payments by nonce
			payments.sort((a, b) => Number(a.nonce) - Number(b.nonce));

			const eddsa = await buildEddsa();
			const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

			//TODO:: make this dynamic
			const maxBatchSize = 10;
			const batchSize = payments.length;
			const enabled = Array(maxBatchSize).fill(0).fill(1, 0, batchSize);

			const padArray = <T>(arr: T[], defaultValue: T): T[] =>
				arr
					.concat(Array(maxBatchSize - arr.length).fill(defaultValue))
					.slice(0, maxBatchSize);

			const uniqueRecipients = new Set(payments.map((p) => p.recipient));
			if (uniqueRecipients.size > 1) {
				throw new Error("Only one type of recipient per batch is supported");
			}

			const lastNonce = payments[payments.length - 1].nonce;
			const recipient = payments[0]?.recipient || "0";

			const proofInputs = {
				receiver: int2hex(
					new PublicKey(recipient).toBuffer().readBigUInt64BE(),
				),
				pubX: eddsa.F.toObject(pubKey[0]),
				pubY: eddsa.F.toObject(pubKey[1]),
				nonce: padArray(
					payments.map((p) => int2hex(Number(p.nonce))),
					int2hex(lastNonce),
				),
				enabled,
				payAmount: padArray(
					payments.map((p) => int2hex(p.amount)),
					"0",
				),
				R8x: padArray(
					payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_1)),
					0,
				),
				R8y: padArray(
					payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_2)),
					0,
				),
				S: padArray(
					payments.map((s) => BigInt(s.signature?.S || 0)),
					BigInt(0),
				),
			};

			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);

			const wasmPath = path.resolve(
				__dirname,
				"../../../../../../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
			);
			const zkeyPath = path.resolve(
				__dirname,
				"../../../../../../zkp/circuits/PaymentBatch_0001.zkey",
			);

			const { proof, publicSignals } = await snarkjs.groth16.fullProve(
				proofInputs,
				wasmPath,
				zkeyPath,
			);

			return { proof, publicSignals, pubKey };
		} catch (e) {
			console.error("Error generating payment proof", e);
			throw e;
		}
	};

	const generatePayment = async ({
		peerId,
		amount,
		paymentAccount,
	}: {
		peerId: PeerId;
		amount: bigint;
		paymentAccount: PublicKey;
	}) => {
		const peer = await peerStore.get(peerId);

		const nonce = getNonce({ peer });
		const recipient = getRecipient({ peer });

		const payment = Payment.decode(
			Payment.encode({
				amount,
				recipient,
				paymentAccount: paymentAccount.toBase58(),
				nonce,
			}),
		);

		const signature = await signPayment(payment, privateKey.raw.slice(0, 32));

		payment.signature = {
			S: signature.S.toString(),
			R8: {
				R8_1: new Uint8Array(signature.R8[0]),
				R8_2: new Uint8Array(signature.R8[1]),
			},
		};

		updateNonce({ peer, nonce: nonce + 1n });

		return payment;
	};

	return {
		generatePayment,
		generatePaymentProof,
		generatePayout,
	};
}
