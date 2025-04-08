import { TypedEventEmitter, type PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";
import { EffectProtocolMessage, Payment } from "../common/index.js";
import { session } from "../common/SessionService.js";
import { createEffectEntity } from "../entity/factory.js";
import { Libp2pTransport } from "../transports/libp2p.js";

import { createTaskManager } from "./modules/createTaskManager.js";
import { createWorkerQueue } from "./modules/createWorkerQueue.js";
import { createPaymentStore } from "../stores/paymentStore.js";
import { createPaymentManager } from "./modules/createPaymentManager.js";
import { managerLogger } from "../common/logging.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";
import { TaskRecord } from "../common/types.js";

export type ManagerEvents = {
	"task:created": (task: TaskRecord) => void;
	"task:accepted": (task: TaskRecord) => void;
	"task:rejected": (task: TaskRecord) => void;
	"task:submission": (task: TaskRecord) => void;
	"task:completed": (task: TaskRecord) => void;
	"payment:created": (payment: Payment) => void;
};

export const createManager = async ({
	datastore,
	privateKey,
}: {
	datastore: Datastore;
	privateKey: PrivateKey;
}) => {
	const paymentStore = createPaymentStore({ datastore });
	const workerQueue = createWorkerQueue();
	const eventEmitter = new TypedEventEmitter<ManagerEvents>();

	const manager = await createEffectEntity({
		transports: [
			new Libp2pTransport({
				privateKey,
				autoStart: true,
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

	const paymentManager = createPaymentManager({
		privateKey,
		peerStore: manager.getNode().peerStore,
		paymentStore,
	});

	const taskStore = createManagerTaskStore({ datastore, eventEmitter });
	const taskManager = createTaskManager({
		eventEmitter,
		manager,
		workerQueue,
		taskStore,
		paymentManager,
	});

	manager
		.onMessage("task", async (task, { peerId }) => {
			await taskStore.create({ task, providerPeerId: peerId });
		})
		.onMessage("taskAccepted", async ({ taskId, worker }, { peerId }) => {
			await taskStore.accept({
				entityId: taskId,
				peerIdStr: peerId.toString(),
			});
		})
		.onMessage("taskCompleted", async ({ taskId, result }, { peerId }) => {
			await taskStore.complete({
				entityId: taskId,
				result,
				peerIdStr: peerId.toString(),
			});
		})
		.onMessage("template", async (template, { peerId }) => {
			// worker requested a template
		})
		.onMessage(
			"taskRejected",
			async ({ taskId, reason, worker }, { connection, peerId }) => {
				await taskStore.reject({
					entityId: taskId,
					peerIdStr: peerId.toString(),
					reason,
				});
			},
		)
		.onMessage("proofRequest", async (proofRequest, { connection, peerId }) => {
			const msg = await paymentManager.generatePaymentProof(
				privateKey,
				proofRequest.payments,
			);

			// send the proof to the worker
			manager.sendMessage(peerId, msg);
		})
		.onMessage(
			"payoutRequest",
			async (payoutRequest, { connection, peerId }) => {
				const payment = await paymentManager.generatePayout({ peerId });

				// send the payment to the worker
				manager.sendMessage(peerId, { payment });
			},
		);

	const node = manager.getNode();

	node.addEventListener("start", async () => {
		console.log("Manager started");

		//every 10 seconds, manage tasks..
		setInterval(async () => {
			await taskManager.manageTasks();
		}, 10000);
	});

	await node.start();

	return {
		node: manager,
		eventEmitter,
		taskStore,
		taskManager,
	};
};
