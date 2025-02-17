<template>
  <div v-if="!publicKey">
    <wallet-multi-button></wallet-multi-button>
  </div>
  <div v-else>
    <div class="text-center my-5">
      <h1 class="text-2xl font-bold">Effect AI Protocol</h1>
      <h2 class="text-mono text-sm">Worker / Alpha v0.0.1</h2>
      <span class="text-sm font-italic">status: running</span>
      <span class="block text-xs">{{ publicKey }}</span>
      <UButton @click="disconnect" class="button mt-5">Disconnect</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
import { createWorkerNode } from "@effectai/protocol";

const { publicKey, disconnect } = useWallet();

const worker = await createWorkerNode([
	"/ip4/127.0.0.1/tcp/36125/ws/p2p/12D3KooWJrT3NJy8HSwMDCUNzSfbapxbbRDsjXX5RCGoVfvJkhu8",
]);

worker.services.taskStore.addEventListener("task:stored", () => {
	console.log("testtt");
});

worker.services.task.addEventListener("task:received", ({ detail }) => {
	console.log("task received", detail);
});

onBeforeUnmount(async () => {
	//stop
	console.log("stopping worker");
	await worker.stop();
});
</script>

<style lang="scss" scoped></style>
