<script setup lang="ts">
import { useConnect, useChainId } from "@wagmi/vue";

const chainId = useChainId();
const { connectors, connect } = useConnect();
const isOpen = ref(true);
</script>

<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <h2 class="title">Connect Wallet</h2>
      </template>

      <div class="flex flex-col gap-3">
        <UButton
          class="bg-black  text-white font-semibold border-2 border-black py-2 px-4 rounded-md shadow-md transition-all"
          v-for="connector in connectors" @click="connect({ connector, chainId })">
          {{ connector.name }}
        </UButton>
      </div>
      <template #footer>
      </template>
    </UCard>
  </UModal>
</template>