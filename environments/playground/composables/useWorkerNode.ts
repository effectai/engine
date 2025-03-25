import {
	createWorkerNode,
	type Task,
	type WorkerNode,
	type Payment,
} from "@effectai/protocol";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { peerIdFromString } from "@libp2p/peer-id";
import { Keypair, PublicKey } from "@solana/web3.js";
import { IDBDatastore } from "datastore-idb";
import { useWallet } from "solana-wallets-vue";
import { buildEddsa } from "circomlibjs";

const nodeInstance = shallowRef<Awaited<WorkerNode> | null>(null);
const isListenersAttached = ref(false);
const isInitialized = ref(false);
const isInitializing = ref(false);
const isPairing = ref(true);
const connected = ref(false);
const managerPeerId: Ref<string | null> = ref(null);
const { privateKey } = useAuth(); //
const connectionTime = ref(0);
const paymentStore = ref<Payment[]>([]);
const taskStore = ref<Task[]>([]);
const toast = useToast();

export const useWorkerNode = () => {
	const initialize = async (privateKey: any) => {
		if (isInitialized.value) return;
		isInitializing.value = true;
		isPairing.value = true;

		const workerKeypair = Keypair.fromSecretKey(privateKey.raw);
		const datastore = new IDBDatastore(
			`worker/${workerKeypair.publicKey.toBase58()}`,
		);
		await datastore.open();
		// await datastore.destroy();
		const config = useRuntimeConfig();
		nodeInstance.value = await createWorkerNode(
			[config.public.MANAGER_MULTI_ADDRESS],
			privateKey,
			datastore,
			async (managerPeerId: string, pub_x: Uint8Array, pub_y: Uint8Array) => {
				const { fetchNonces } = useNonce();
				const { publicKey } = useWallet();

				const managerPublicKey = getPublicKeyFromPeerId(managerPeerId);
				if (!workerPublicKey.value || !managerPublicKey) return;

				const eddsa = await buildEddsa();

				const { nextNonce, remoteNonce } = await fetchNonces(
					publicKey.value,
					new PublicKey(eddsa.F.toObject(pub_x)),
				);

				toast.add({
					title: "Pairing Successful",
					description: "Successfully Paired with manager",
				});
				isPairing.value = false;

				return { nonce: nextNonce, delegate: publicKey.value };
			},
		);

		attachListeners(nodeInstance.value);

		isInitialized.value = true;
		isInitializing.value = false;
	};

	const start = async () => {
		if (!nodeInstance.value) return;
		await nodeInstance.value.start();
	};

	const stop = async () => {
		if (!nodeInstance.value) return;
		await nodeInstance.value.stop();
	};

	const attachListeners = (node: Awaited<WorkerNode>) => {
		if (isListenersAttached.value) return;

		node.addEventListener("start", async () => {
			taskStore.value = await node.services.worker.getTasks();
			paymentStore.value = await node.services.worker.getPayments();
		});

		node.services.worker.addEventListener(
			"task:received",
			async ({ detail }) => {
				taskStore.value = await node.services.worker.getTasks();
				toast.add({
					title: "Task Received",
					description: `Received task ${detail.title}`,
				});
			},
		);

		node.services.worker.addEventListener(
			"payment:received",
			async ({ detail }) => {
				paymentStore.value = await node.services.worker.getPayments();
				toast.add({
					title: "Payment Received",
					description: `Received ${formatBigIntToAmount(
						detail.payment?.amount,
					)} EFFECT`,
				});
			},
		);

		node.addEventListener("peer:connect", async ({ detail }) => {
			// console.log("Peer connected:", detail);
		});

		node.addEventListener("peer:identify", async ({ detail }) => {
			if (detail.protocols.includes("/effectai/manager/0.0.1")) {
				managerPeerId.value = detail.peerId.toString();
				connected.value = true;
				connectionTime.value = Date.now() / 1000;
			}
		});

		isListenersAttached.value = true;
	};

	watchEffect(async () => {
		if (!privateKey.value || isInitialized.value || isInitializing.value)
			return;

		isInitializing.value = true;

		const keyBuffer = Buffer.from(privateKey.value, "hex");
		const ed25519PrivateKey = await generateKeyPairFromSeed(
			"Ed25519",
			keyBuffer.slice(0, 32),
		);

		await initialize(ed25519PrivateKey);
		await start();
	});

	const publicKey = computed(() =>
		nodeInstance.value?.peerId.publicKey?.toString(),
	);

	const workerPublicKey = computed(() => {
		if (!nodeInstance.value || !nodeInstance.value.peerId.publicKey) return;
		return new PublicKey(nodeInstance.value?.peerId.publicKey.raw);
	});

	const managerPublicKey = computed(() => {
		if (!managerPeerId.value) return;
		const peerId = peerIdFromString(managerPeerId.value);
		return new PublicKey(peerId.publicKey.raw);
	});

	return {
		node: nodeInstance,

		workerPublicKey,
		managerPublicKey,
		managerPeerId,

		publicKey,
		privateKey,

		start,
		stop,
		connected,
		paymentStore,
		taskStore,

		isPairing,
		connectionTime,
	};
};
