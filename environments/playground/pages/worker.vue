<template>
	<div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
		<img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
			width="1308" />
		<div
			class="absolute inset-0 bg-[url(/img/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
		</div>
		<div
			class="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
			<div class="mx-auto max-w-md">
				<h1 class="text-xl">Worker Node</h1>
				<div class="divide-y divide-gray-300/50">
					<div class="my-5" v-if="isRunning">
						<div class="my-5 text-sm" v-if="workerNode?.node?.peerId">
							<p class="text-sm">peerId: {{ sliceBoth(workerNode.node.peerId.toString()) }}</p>
							Connected peers: {{ peers?.length || 0 }}
						</div>

					</div>
					<div class="pt-8 text-base font-semibold leading-7">
						<h2 v-if="incomingTask">Incoming Task from Manager:
							<div class="font-normal">{{ incomingTask }}</div>
						</h2>
						<div v-else>
							<p class="text-sm text-slate-300 my-2">awaiting tasks from managers.</p>
							<UProgress animation="carousel" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import {
	multiaddr,
	Task,
	WebRTC,
	type Multiaddr,
	type Peer,
	type TaskPayload,
} from "@effectai/task-core";
import { type WorkerNode, createWorkerNode } from "@effectai/task-worker";

// connect to relay server
const workerNode = shallowRef<WorkerNode | null>(null);
const peers = shallowRef<Peer[] | undefined>([]);
const isRunning = ref(false);
const incomingTask = ref<Task | null>();
const config = useRuntimeConfig();

onBeforeUnmount(async () => {
	if (workerNode.value) {
		await workerNode.value.node?.stop();
	}
});

onMounted(async () => {
	if (!config.public.BOOTSTRAP_NODE) {
		throw new Error(
			"No bootstrap node provided, please check your env file & config",
		);
	}

	workerNode.value = await createWorkerNode([config.public.BOOTSTRAP_NODE]);

	await workerNode.value.node?.start();

	isRunning.value = true;

	if (!workerNode.value.node) {
		throw new Error("node is not available");
	}

	await workerNode.value.listenForTask();

	workerNode.value.on("incoming-task", async (task: TaskPayload) => {
		console.log("Received task", task);
		const t = Task.fromPayload(task);
		incomingTask.value = t;
	});

	workerNode.value.node?.addEventListener("peer:discovery", (peer) => {
		updatePeers();
	});
});

const updatePeers = async () => {
	peers.value = await workerNode.value?.node?.peerStore.all();
};
</script>

<style scoped></style>