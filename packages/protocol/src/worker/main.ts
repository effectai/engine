import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";
import { EffectProtocolMessage, Payment, Task } from "../common/index.js";
import { session } from "../common/SessionService.js";
import { createEffectEntity } from "../entity/factory.js";
import { Libp2pTransport } from "../transports/libp2p.js";
import { createPaymentStore } from "../stores/paymentStore.js";
import { PrivateKey, TypedEventEmitter } from "@libp2p/interface";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webTransport } from "@libp2p/webtransport";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { createTaskWorker } from "./modules/createTaskWorker.js";
import { createCoreTaskStore } from "../stores/taskStore.js";
import { createWorkerTaskStore } from "./stores/workerTaskStore.js";
import { createPaymentWorker } from "./modules/createPaymentWorker.js";
import { TaskRecord } from "../common/types.js";

export type WorkerEvents = {
	"task:created": (task: Task) => void;
	"task:completed": (task: TaskRecord) => void;
	"task:accepted": (task: TaskRecord) => void;
	"task:rejected": (task: TaskRecord) => void;
	"payment:created": (payment: Payment) => void;
};

export const createWorker = async ({
	datastore,
	privateKey,
	bootstrap,
	getSessionData,
}: {
	bootstrap: string[];
	datastore: Datastore;
	privateKey: PrivateKey;
	getSessionData: () => {
		recipient: string;
		nonce: bigint;
	};
}) => {
	const eventEmitter = new TypedEventEmitter<WorkerEvents>();

	const taskStore = createWorkerTaskStore({ datastore });
	const paymentStore = createPaymentStore({ datastore });

	const worker = await createEffectEntity({
		transports: [
			new Libp2pTransport({
				privateKey,
				autoStart: false,
				bootstrap,
				listen: ["/p2p-circuit", "/webrtc"],
				services: {
					session: session({
						getData: () => ({
							role: "worker",
							...getSessionData(),
						}),
					}),
				},
				transports: [
					webSockets(),
					webRTC(),
					webTransport(),
					circuitRelayTransport(),
				],
				protocol: {
					name: "/effectai/1.0.0",
					scheme: EffectProtocolMessage,
				},
			}),
		],
		datastore,
	});

	const { requestPayout } = createPaymentWorker({ taskStore, worker });

	const { acceptTask, rejectTask, completeTask, getTask } = createTaskWorker({
		eventEmitter,
		taskStore,
		worker,
	});

	worker
		.onMessage("task", async (task, { peerId }) => {
			await taskStore.create({ task, managerPeerId: peerId });
			eventEmitter.safeDispatchEvent("task:created", { detail: task });
		})
		.onMessage("payment", async (payment, { peerId }) => {
			await paymentStore.create({
				payment,
			});
			eventEmitter.safeDispatchEvent("payment:created", { detail: payment });
		})
		.onMessage("proofResponse", async (response, { peerId }) => {});

	worker.getNode().addEventListener("start", () => {});

	return {
		node: worker,
		eventEmitter,
		getTask,
		requestPayout,
		acceptTask,
		rejectTask,
		completeTask,
	};
};
