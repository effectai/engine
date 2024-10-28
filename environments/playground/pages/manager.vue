<template>
<div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
  <img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" />
  <div class="absolute inset-0 bg-[url(/img/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
  <div class="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
    <div class="mx-auto max-w-md">
		<h1 class="text-xl">Manager Node</h1>
      <div class="divide-y divide-gray-300/50">
		<div class="my-5" v-if="isRunning">
			Connected worker nodes: {{ workerPeers?.length || 0 }}
      <div class="my-5">
        <URadioGroup
          v-model="selectedWorker"
          :options="workerPeers.map(peer => ({ label: sliceBoth(peer.id.toString()), value: peer.id }))"
        >
        </URadioGroup>
			<UButton :disabled="!selectedWorker" @click="sendTask" class="mt-5">Send Task</UButton>
      </div>
		</div>
        <div class="pt-8 text-base font-semibold leading-7">
          <p class="text-gray-900">Want to dig deeper into the network?</p>
          <p>
            <a href="https://effect.ai/docs" class="text-sky-500 hover:text-sky-600">Read the docs &rarr;</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

</template>

<script lang="ts" setup>
import { Task, multiaddr, type Peer } from "@effectai/task-core";
import { type ManagerNode, createManagerNode } from "@effectai/task-manager";
import { exampleBatch } from "~/constants/exampleBatch";

const isRunning = ref(false);
const peers = ref<Peer[]>([]);
const managerNode = ref<ManagerNode | null>(null);
const workerPeers = computed(() =>
	peers.value.filter((peer) => !peer.tags.has("bootstrap")),
);

const selectedWorker = ref<string | null>(null);

const updatePeers = async () => {
	peers.value = await managerNode.value?.node?.peerStore.all();
};

const sliceBoth = (str: string) => {
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

const sendTask = async () => {
	if (!managerNode.value) {
		throw new Error("Manager node is not available");
	}

	try {
		const foundPeer = workerPeers.value.find(
			(peer) => peer.id.toString() == selectedWorker.value,
		);
		const tasks = exampleBatch.extractTasks();

		// TODO:: find the webrtc MA
		await managerNode.value.delegateTaskToWorker(
			tasks[0],
			multiaddr(foundPeer?.addresses[1].multiaddr),
		);
	} catch (e) {
		console.error(e);
	}
};

onMounted(async () => {
	try {
		console.log("Creating manager node");
		managerNode.value = await createManagerNode([
			"/ip4/127.0.0.1/tcp/15003/ws/p2p/12D3KooWHq8fCAmHAM3DHa3tDcRxjPUsbkdeXAHyTXDc4x8NEtjm",
		]);

		managerNode.value.node?.addEventListener("peer:discovery", ({ detail }) => {
			console.log(detail);
			updatePeers();
		});

		await managerNode.value.start();

		isRunning.value = true;
	} catch (e) {
		console.error(e);
	}
});
</script>

<style scoped>

</style>