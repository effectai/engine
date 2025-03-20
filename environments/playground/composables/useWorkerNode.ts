import {
	createWorkerNode,
	type Task,
	type WorkerNode,
	type Payment,
} from "@effectai/protocol";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { peerIdFromString } from "@libp2p/peer-id";

type WorkerNodeStore = {
	node: Ref<Awaited<WorkerNode>>;
	taskStore: Ref<Task[]>;
	paymentStore: Ref<Payment[]>;
	publicKey: Ref<string | null>;
};

let workerNodeStore: WorkerNodeStore | null = null;

const createWorkerNodeStore = async (): Promise<WorkerNodeStore> => {
	const taskStore = ref<Task[]>([]);
	const paymentStore = ref<Payment[]>([]);

	const privateKey = localStorage.getItem("privateKey");
	const privateKeyHex = Buffer.from(privateKey as string, "hex");

	const timeSinceLastPayout = new Date().getTime() / 1000;

	const key = await generateKeyPairFromSeed(
		"Ed25519",
		privateKeyHex.slice(0, 32),
	);

	const node = ref(
		await createWorkerNode(
			[
				"/ip4/127.0.0.1/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
			],
			key,
		),
	);

	node.value.addEventListener("start", async () => {
		taskStore.value = await node.value.services.worker.getTasks();
		paymentStore.value = await node.value.services.worker.getPayments();
	});

	await node.value.start();

	//check if we're still connected every 5 seconds
	const managerPeerId = peerIdFromString(
		"12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
	);

	const connected = ref(false);

	setInterval(async () => {
		const connections = node.value.getConnections(managerPeerId);
		connected.value = connections.length > 0;
	}, 5000);

	node.value.services.worker.addEventListener("task:received", async () => {
		taskStore.value = await node.value.services.worker.getTasks();
	});

	node.value.services.worker.addEventListener(
		"payment:received",
		async ({ detail }) => {
			paymentStore.value = await node.value.services.worker.getPayments();
		},
	);

	const currentNonce = ref(1);
	const claimablePayments = computed(() =>
		paymentStore.value
			.filter((p) => p.nonce <= currentNonce.value)
			.map((payment) => {
				return {
					nonce: payment.nonce,
					amount: payment.amount,
				};
			}),
	);

	const claimableAmount = computed(() =>
		claimablePayments.value.reduce((acc, payment) => acc + payment.amount, 0n),
	);

	const publicKey = computed(() => {
		return node.value.peerId.publicKey?.toString();
	});

	const unpaidUptime = computed(() => {});

	const requestPayout = async () => {
		const payment =
			await node.value.services.worker.requestPayout(managerPeerId);
		console.log(payment);
	};

	return {
		node,

		taskStore,
		paymentStore,

		claimablePayments,
		claimableAmount,

		publicKey,

		currentNonce,
		connected,
	};
};

export const useWorkerNode = async () => {
	if (workerNodeStore === null) {
		workerNodeStore = await createWorkerNodeStore();
	}
	return workerNodeStore;
};
