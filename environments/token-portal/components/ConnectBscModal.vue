<script setup lang="ts">
import { useConnect, useChainId, useAccount } from "@wagmi/vue";
const chainId = useChainId();

const { isConnected } = useAccount();
const { connectors, connect } = useConnect();

</script>

<template>
  <UModal>
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <h2 class="title">Connect Wallet</h2>
      </template>
      <div class="flex flex-col gap-3">
        <UButton color="black" v-for="connector in connectors" @click="connect({ connector, chainId })">
          {{ connector.name }}
        </UButton>
      </div>
      <template #footer>
      </template>
    </UCard>
  </UModal>
</template>