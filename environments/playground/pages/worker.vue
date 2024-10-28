<template>
	<div class="flex justify-center p-20 bg-green-500">
		<div v-if="workerNode" class="p-10 text-center" >
			PeerId: {{ workerNode?.node?.peerId }}
			<br />
			<div v-if="peers">
				Connected peers: {{ peers.length }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { multiaddr, WebRTC, type Multiaddr, type Peer } from "@effectai/task-core";
import { type WorkerNode, createWorkerNode } from "@effectai/task-worker";

// connect to relay server
const workerNode = shallowRef<WorkerNode | null>(null);
const peers = shallowRef<Peer[] | undefined>([]);

onMounted(async () => {
	workerNode.value = await createWorkerNode(["/ip4/127.0.0.1/tcp/15003/ws/p2p/12D3KooWSYSk15diP2PfXd1S1CMgRvKUtEB3ndEA33MsDgUA8Rgn"]);

	
	await workerNode.value.node?.start();
    
	workerNode.value.node?.addEventListener("peer:discovery", (peer) => {
		updatePeers();
	});

	if (!workerNode.value.node) {
		throw new Error("node is not available");
	}

	await workerNode.value.listenForTask();

	workerNode.value.on("incoming-task", async (task) => {
		console.log("Received task", task);
	});

});

const updatePeers = async () => {
	peers.value = await workerNode.value?.node?.peerStore.all()

	console.log("peers", peers.value);
};

</script>

<style scoped></style>