<template>
  <div class="w-full">
    <div>
      <UInput v-model="address" />
      <UButton @click="connect" class="btn btn-primary mt-2" color="white">
        Connect
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createWorkerNode } from "@effectai/protocol";

const address = ref<string>("");
const connect = async () => {
	console.log("Connecting to worker node...");
	const workerNode = await createWorkerNode([address.value]);
	workerNode.start();
};
</script>

<style scoped></style>
