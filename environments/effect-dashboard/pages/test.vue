<template>
  <div>
    hello
    {{ store.connectedOn }}
  </div>
</template>

<script setup lang="ts">
import { useWorkerStore } from "@/stores/worker";

const store = useWorkerStore();
const privateKey = useLocalStorage("privateKey", null);
const privateKeyBytes = Buffer.from(privateKey.value, "hex").slice(0, 32);

await store.initialize(privateKeyBytes);
</script>

<style lang="scss" scoped></style>
