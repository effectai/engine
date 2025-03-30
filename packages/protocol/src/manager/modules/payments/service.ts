import { PeerId, type PeerStore, type PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import {
	Payment,
	ProofRequest,
	type PaymentMessage,
} from "../../../common/proto/effect.js";
import { ProtoStore } from "../../../common/proto-store.js";
import type { Datastore } from "interface-datastore";
import { int2hex } from "../../../utils/utils.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as snarkjs from "snarkjs";
import { peerIdFromString } from "@libp2p/peer-id";
import { buildEddsa } from "circomlibjs";
import type { MessageStream } from "it-protobuf-stream";
import { signPayment } from "./utils.js";

export interface ManagerPaymentServiceComponents {
	peerStore: PeerStore;
	privateKey: PrivateKey;
	datastore: Datastore;
}

export class ManagerPaymentService {
	private readonly store: ProtoStore<Payment>;

	constructor(private components: ManagerPaymentServiceComponents) {
		this.store = new ProtoStore<Payment>(this.components, {
			prefix: "payments",
			encoder: Payment.encode,
			decoder: Payment.decode,
		});
	}

	public async generatePayment(
		peerId: string,
		nonce: bigint,
		amount: bigint,
		recipient: PublicKey,
		paymentAccount: PublicKey,
	) {
		const payment = Payment.decode(
			Payment.encode({
				amount,
				recipient: recipient.toBase58(),
				paymentAccount: paymentAccount.toBase58(),
				nonce,
			}),
		);

		const signature = await signPayment(payment, this.components.privateKey);

		payment.signature = {
			S: signature.S.toString(),
			R8: {
				R8_1: new Uint8Array(signature.R8[0]),
				R8_2: new Uint8Array(signature.R8[1]),
			},
		};

		await this.store.put(`${peerId}/${payment.nonce.toString()}`, payment);

		return payment;
	}

	public async generatePaymentProof(payments: ProofRequest.PaymentProof[]) {
		try {
			//sort payments by nonce
			payments.sort((a, b) => Number(a.nonce) - Number(b.nonce));

			const eddsa = await buildEddsa();
			const pubKey = eddsa.prv2pub(this.components.privateKey.raw.slice(0, 32));

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
				receiver: int2hex(new PublicKey(recipient).toBuffer().readBigInt64BE()),
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
	}
}
