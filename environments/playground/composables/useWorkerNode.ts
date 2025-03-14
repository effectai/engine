import {
	createWorkerNode,
	type Task,
	type WorkerNode,
	type Challenge,
	type Payment,
} from "@effectai/protocol";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { peerIdFromString } from "@libp2p/peer-id";

type WorkerNodeStore = {
	node: Ref<Awaited<WorkerNode>>;
	taskStore: Ref<Task[]>;
	challengeStore: Ref<Challenge[]>;
	paymentStore: Ref<Payment[]>;
	publicKey: Ref<string | null>;
};

let workerNodeStore: WorkerNodeStore | null = null;

const createWorkerNodeStore = async (): Promise<WorkerNodeStore> => {
	const taskStore = ref<Task[]>([]);
	const challengeStore = ref<Challenge[]>([]);
	const paymentStore = ref<Payment[]>([]);

	const privateKey = localStorage.getItem("privateKey");
	const privateKeyHex = Buffer.from(privateKey as string, "hex");

	const key = await generateKeyPairFromSeed(
		"Ed25519",
		privateKeyHex.slice(0, 32),
	);

	const node = shallowRef(
		await createWorkerNode(
			[
				"/ip4/127.0.0.1/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
			],
			key,
		),
	);

	node.value.addEventListener("start", async () => {
		taskStore.value = await node.value.services.worker.getTasks();
		challengeStore.value = await node.value.services.worker.getChallenges();
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
		"challenge:received",
		async () => {
			challengeStore.value = await node.value.services.worker.getChallenges();
		},
	);

	node.value.services.worker.addEventListener(
		"payment:received",
		async ({ detail }) => {
			paymentStore.value = await node.value.services.worker.getPayments();
		},
	);

	const currentNonce = ref(0);
	const claimablePayments = computed(() =>
		paymentStore.value
			.filter((p) => p.nonce <= currentNonce.value)
			.map((payment) => {
				return {
					id: payment.id,
					amount: payment.amount,
				};
			}),
	);

	const claimableAmount = computed(() =>
		claimablePayments.value.reduce((acc, payment) => acc + payment.amount, 0),
	);

	const publicKey = computed(() => {
		return node.value.peerId.publicKey?.toString();
	});

	return {
		node,

		taskStore,
		challengeStore,
		paymentStore,

		claimablePayments,
		claimableAmount,

		publicKey,

		connected,
	};
};

export const useWorkerNode = async () => {
	if (workerNodeStore === null) {
		workerNodeStore = await createWorkerNodeStore();
	}
	return workerNodeStore;
};
