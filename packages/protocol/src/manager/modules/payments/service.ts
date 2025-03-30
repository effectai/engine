import { PeerId, type PeerStore, type PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { Payment, PaymentMessage } from "../../../proto/effect.js";
import { ProtoStore } from "../../../common/proto-store.js";
import type { Datastore } from "interface-datastore";
import { int2hex } from "../../../utils/utils.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as snarkjs from "snarkjs";
import { peerIdFromString } from "@libp2p/peer-id";
import { buildEddsa } from "circomlibjs";
import { MessageStream } from "it-protobuf-stream";

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

	private async handlePaymentMessage(
		remotePeer: string,
		stream: MessageStream<ManagerMessage>,
		payment: PaymentMessage,
	) {
		if (payment.proofRequest) {
			try {
				const { proof, publicSignals, pubKey } =
					await this.generatePaymentProof(payment.proofRequest);

				const message: WorkerMessage = {
					payment: {
						proofResponse: {
							R8: {
								R8_1: pubKey[0],
								R8_2: pubKey[1],
							},
							signals: {
								minNonce: publicSignals[0],
								maxNonce: publicSignals[1],
								amount: BigInt(publicSignals[2]),
							},
							piA: proof.pi_a,
							piB: [
								{ row: [proof.pi_b[0][0], proof.pi_b[0][1]] },
								{ row: [proof.pi_b[1][0], proof.pi_b[1][1]] },
								{ row: [proof.pi_b[2][0], proof.pi_b[2][1]] },
							],
							piC: proof.pi_c,
							protocol: proof.protocol,
							curve: proof.curve,
						},
					},
				};

				await stream.write(message);
			} catch (e) {
				console.error("Error generating payment proof", e);
			}
		} else if (payment.payoutRequest) {
			const peer = peerIdFromString(remotePeer);
			const peerData = await this.components.peerStore.get(peer);
			const timeSinceLastPayout = peerData.metadata.get("timeSinceLastPayout");

			if (!timeSinceLastPayout) {
				console.error("No timeSinceLastPayout found");
				return;
			}

			const recoveredTimestamp = new DataView(
				new Uint8Array(timeSinceLastPayout).buffer,
			).getUint32(0, false);

			const payoutTimeInSeconds =
				Math.floor(new Date().getTime() / 1000) - recoveredTimestamp;

			const payment = await this.generatePayment(
				remotePeer,
				BigInt(payoutTimeInSeconds * 1_000_00),
			);

			const timestamp = Math.floor(new Date().getTime() / 1000);
			const buffer = Buffer.alloc(4);
			buffer.writeUInt32BE(timestamp, 0);

			//update last payout time
			await this.components.peerStore.merge(peer, {
				metadata: {
					timeSinceLastPayout: buffer,
				},
			});

			if (!payment) {
				//TODO:: error logging
				console.error("error generating payment");
				return;
			}

			await stream.write(payment);
		}
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

	private async generatePaymentProof(payments: Payment[]) {
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
