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
				<h1 class="text-xl">Manager Node
					<span class="text-sm" v-if="formattedPeer">({{ formattedPeer }})</span>
				</h1> 
				<div class="divide-y divide-gray-300/50 font-mono">
					<div class="" v-if="isRunning">
						<p class="font-sm">Connected worker nodes: {{ workerPeers?.length || 0 }}</p>
						<div class="my-5">
							<URadioGroup v-model="selectedWorker"
								:options="workerPeers.map(peer => ({ label: sliceBoth(peer.id.toString()), value: peer.id }))">
							</URadioGroup>
							<UButton :disabled="!selectedWorker" @click="sendTask" class="mt-5">Send Task</UButton>
						</div>
					</div>
					<div class="pt-8 text-base font-semibold leading-7">
						<p class="text-gray-900">Want to dig deeper into the network?</p>
						<p>
							<a href="https://effect.ai/docs" class="text-sky-500 hover:text-sky-600">Read the docs
								&rarr;</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Task, multiaddr, type Peer, WebRTC } from "@effectai/task-core";
import { type ManagerNode, createManagerNode } from "@effectai/task-manager";
import { exampleBatch } from "~/constants/exampleBatch";

const isRunning = ref(false);
const config = useRuntimeConfig();
const managerNode = shallowRef<ManagerNode | null>(
	await createManagerNode([config.public.BOOTSTRAP_NODE]),
);
await managerNode.value?.node?.start();
isRunning.value = true;

if (!managerNode.value?.node) {
	throw new Error("Manager node is not available");
}

const { workerPeers, refreshPeers } = usePeerInfo(managerNode.value.node);

const toast = useToast();

const formattedPeer = computed(() => {
	if (managerNode.value?.node?.peerId) {
		return sliceBoth(managerNode.value.node.peerId.toString());
	}
	return null;
});

const selectedWorker = ref<string | null>(null);

const sendTask = async () => {
	if (!managerNode.value) {
		throw new Error("Manager node is not available");
	}

	try {
		// find peer in peerStore
		const peer = workerPeers.value?.find(
			(peer) => peer.id.toString() === selectedWorker.value?.toString(),
		);
		if (!peer) {
			throw new Error("Selected worker is not available");
		}
		const webrtcWithPeerId = peer.addresses.filter((addr) =>
			/webrtc\/p2p\/\w+$/.test(multiaddr(addr.multiaddr).toString()),
		);

		if (!webrtcWithPeerId) {
			throw new Error("Selected peer does not have a dialable address");
		}

		// send an example task to the worker
		const tasks = exampleBatch.extractTasks();
		await managerNode.value.delegateTaskToWorker(
			tasks[0],
			multiaddr(webrtcWithPeerId[0].multiaddr),
		);

		toast.add({
			color: "green",
			title: "Task sent",
			description: "Task has been sent to the worker node",
		});
	} catch (e) {
		console.error(e);
	}
};

const interval = setInterval(() => {
	refreshPeers();
}, 7500);

onBeforeUnmount(async () => {
	if (managerNode.value) {
		await managerNode.value.node?.stop();
	}
	clearInterval(interval);
});
</script>

<style scoped></style>