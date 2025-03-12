import {
	createWorkerNode,
	type Task,
	type WorkerNode,
	Challenge,
} from "@effectai/protocol";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { peerIdFromString } from "@libp2p/peer-id";

type WorkerNodeStore = {
	node: Ref<Awaited<WorkerNode>>;
	taskStore: Ref<Task[]>;
	challengeStore: Ref<Challenge[]>;
	publicKey: Ref<string | null>;
};

let workerNodeStore: WorkerNodeStore | null = null;

export const useWorkerNode = async () => {
	if (workerNodeStore === null) {
		workerNodeStore = await createWorkerNodeStore();
	}
	return workerNodeStore;
};

const createWorkerNodeStore = async (): Promise<WorkerNodeStore> => {
	const taskStore = ref<Task[]>([]);
	const challengeStore = ref<Challenge[]>([]);

	const seed = localStorage.getItem("seed") || generateSeed().toString("hex");
	localStorage.setItem("seed", seed);

	const key = await generateKeyPairFromSeed(
		"Ed25519",
		Buffer.from(seed, "hex"),
	);

	const node = ref(
		await createWorkerNode(
			[
				"/ip4/127.0.0.1/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
			],
			key,
		),
	);

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
		console.log("task received");
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
			console.log("payment received", detail);
		},
	);

	const publicKey = computed(() => {
		return node.value.peerId.publicKey?.toString();
	});

	return {
		taskStore,
		challengeStore,
		node,
		publicKey,
		seed,
		connected,
	};
};
