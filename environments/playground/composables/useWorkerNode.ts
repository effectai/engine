import type {
	Task,
	Libp2p,
	Stream,
} from "@effectai/task-core";
import { createWorkerNode, type WorkerState } from "@effectai/task-worker";

type WorkerNodeStore = {
	node: Ref<Libp2p>;
	isRunning: Ref<boolean>;

	incomingTasks: Ref<Map<string, {stream: Stream, task:Task}>>;
	
	status: Ref<string>;
	activeTask: Ref<Task | null>;
	peerId: Ref<string | null | undefined>;
	peerIdFormatted: Ref<string | undefined>;

	acceptTask: (task: Task) => Promise<void>;
	submitTask: (task: Task) => Promise<void>;
};

let workerNode: WorkerNodeStore | null = null;

export const useWorkerNode = async () => {
	if (!workerNode) {
		workerNode = await createWorkerNodeStore();
		return workerNode;
	}
	return workerNode;
};

export const createWorkerNodeStore = async (): Promise<WorkerNodeStore> => {
	const config = useRuntimeConfig();

	if (!config.public.BOOTSTRAP_NODE) {
		throw new Error(
			"No bootstrap node provided, please check your env file & config",
		);
	}

	const state = computed(() => workerNode.value.state);
	const incomingTasks = computed(() => workerNode.value.state.incomingTasks);
	const activeTask = computed(() => workerNode.value.state.activeTask);
	const status = computed(() => workerNode.value.state.status);

	const workerNode = ref(
		await createWorkerNode([config.public.BOOTSTRAP_NODE]),
	);

	const node = computed(() => workerNode.value.node);
	const peerId = computed(() => node.value?.peerId.toString());
	const peerIdFormatted = computed(
		() => peerId.value && sliceBoth(peerId.value),
	);
	const isRunning = computed(() => node.value?.status === "started");

	const acceptTask = async (task: Task) => {
		console.log("accepting task", task);
		await workerNode.value.acceptTask(task);
	};

	const rejectTask = async (task: Task) => {
		await workerNode.value.rejectTask(task);
	};

	const submitTask = async (task: Task) => {
		await workerNode.value.submitTask(task);
	}

	// start the node
	await workerNode.value.start();

	// listen for tasks
	await workerNode.value.listenForTask();

	return {
		// The Libp2p Node
		node,

		activeTask,
		status,

		peerId,
		peerIdFormatted,

		incomingTasks,

		state,
		isRunning,

		acceptTask,
		rejectTask,
		submitTask
	};
};
