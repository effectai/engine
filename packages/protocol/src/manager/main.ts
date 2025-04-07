import type { PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";
import { EffectProtocolMessage } from "../common/index.js";
import { session } from "../common/SessionService.js";
import { createEffectEntity } from "../entity/factory.js";
import { createTaskStore } from "../stores/taskStore.js";
import { Libp2pTransport } from "../transports/libp2p.js";

import { createTaskManager } from "./modules/createTaskManager.js";
import { createWorkerQueue } from "./modules/createWorkerQueue.js";
import { createPaymentStore } from "../stores/paymentStore.js";
import { createPaymentManager } from "./modules/createPaymentManager.js";
import { managerLogger } from "../common/logging.js";

export const createManager = async ({
	datastore,
	privateKey,
}: {
	datastore: Datastore;
	privateKey: PrivateKey;
}) => {
	const taskStore = createTaskStore({ datastore });
	const paymentStore = createPaymentStore({ datastore });

	const workerQueue = createWorkerQueue();

	const manager = await createEffectEntity({
		transports: [
			new Libp2pTransport({
				privateKey,
				listen: ["/ip4/0.0.0.0/tcp/34861/ws"],
				services: {
					session: session({
						getData: () => ({
							role: "manager",
							pub_x: "0x1234567890abcdef",
							pub_y: "0xabcdef1234567890",
						}),
					}),
				},
				transports: [webSockets()],
				protocol: {
					name: "/effectai/1.0.0",
					scheme: EffectProtocolMessage,
				},
				onConnect: async ({
					peerStore,
					sessionService,
					peerId,
					connection,
				}) => {
					try {
						// handshake for generic session data.
						const { role, nonce, recipient } =
							await sessionService.peformHandshakeInitiator(connection);

						// set last payout on connect..
						const lastPayoutTimestamp = Math.floor(Date.now() / 1000);
						peerStore.merge(peerId, {
							metadata: {
								"session:lastPayout": new TextEncoder().encode(
									lastPayoutTimestamp.toString(),
								),
							},
						});

						// add worker to queue
						if (role === "worker" && nonce && recipient) {
							managerLogger.info(
								{ peer: peerId.toString(), recipient, nonce },
								"Worker connected",
							);

							workerQueue.addWorker(peerId);
						}
					} catch (err) {
						console.error("Error in handshake initiator:", err);
					}
				},
			}),
		],
		datastore,
	});

	// <------ MANAGER -----> define modules

	const paymentManager = createPaymentManager({
		privateKey,
		peerStore: manager.getNode().peerStore,
		paymentStore,
	});

	const taskManager = createTaskManager({
		manager,
		taskStore,
		workerQueue,
		paymentManager,
	});

	// <------ MANAGER -----> Handle incoming messages

	manager
		.onMessage("task", async (task, { peerId }) => {
			await taskManager.createTask({ task, providerPeerId: peerId });
		})
		.onMessage("taskAccepted", async ({ taskId, worker }, { peerId }) => {
			const taskRecord = await taskStore.get({ entityId: taskId });
			await taskManager.acceptTask({ taskRecord, worker: peerId });
		})
		.onMessage("taskCompleted", async ({ taskId, result }, { peerId }) => {
			const taskRecord = await taskStore.get({ entityId: taskId });
			await taskManager.completeTask({ taskRecord, result, worker: peerId });
		})
		.onMessage("template", async (template, { peerId }) => {
			// worker requested a template
		})
		.onMessage(
			"taskRejected",
			async ({ taskId, reason, worker }, { connection, peerId }) => {
				const taskRecord = await taskStore.get({ entityId: taskId });
				await taskManager.rejectTask({ taskRecord, reason });
			},
		)
		.onMessage("proofRequest", async (proofRequest, { connection, peerId }) => {
			const { proof, pubKey, publicSignals } =
				await paymentManager.generatePaymentProof(
					privateKey,
					proofRequest.payments,
				);

			const msg: EffectProtocolMessage = {
				proofResponse: {
					r8: {
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
			};

			//TODO:: send this message back
		})
		.onMessage(
			"payoutRequest",
			async (payoutRequest, { connection, peerId }) => {
				const payment = await paymentManager.generatePayout({ peerId });
				// send the payment to the worker
			},
		);

	return {
		manager,
	};
};
