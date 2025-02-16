<template>
  <div>
    <div class="text-center my-5">
      <h1 class="text-2xl font-bold">Effect AI Protocol</h1>
      <h2 class="text-mono text-sm">Worker / Alpha v0.0.1</h2>
      <span class="text-sm font-italic">status: running</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createWorkerNode } from "@effectai/protocol";

const worker = await createWorkerNode([
	"/ip4/127.0.0.1/tcp/39357/ws/p2p/12D3KooWHhf4tzCs9ShwgmwZEt3tAGcTCpEjS6GExxNPcapjP2Ec",
]);

worker.services.taskStore.addEventListener("task:stored", () => {
	console.log("test");
});

const fetchTasks = async () => {
	await worker.services.taskStore.all();
};

worker.services.task.addEventListener("task:received", ({ detail }) => {
	console.log("task received", detail);
});

onBeforeUnmount(async () => {
	console.log("cleaning up..");
	await worker.stop();
});

onMounted(() => {
	console.log("hello!");
});
</script>

<style lang="scss" scoped></style>
