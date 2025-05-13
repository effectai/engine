<template>
  <div>
    <div v-if="!publicKey">
      <div class="flex items-center flex-col justify-center h-96">
        <div class="gap-5 flex flex-col items-center justify-center">
          <div class="text-center space-y-2">
            <h2 class="text-4xl">Welcome 🌇</h2>
            <h1 class="text-2xl">Please connect your Solana wallet.</h1>
          </div>
          <ClientOnly>
            <WalletMultiButton />
          </ClientOnly>
        </div>
      </div>
    </div>
    <UTabs v-if="publicKey" :items="items" class="" v-model="selected">
      <template #overview="{ item }">
        <div class="">
          <StakeOverviewCard />
        </div>
      </template>
      <template #stake="{ item }">
        <div class>
          <StakingForm @submit="selected = 0" />
        </div>
      </template>
      <template #unstake>
        <div class="flex justify-between gap-3 flex-col md:flex-row">
          <UnstakeForm class="flex-grow" />
          <UnstakesCard />
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
  import { WalletMultiButton, useWallet } from "solana-wallets-vue";

  const items = [
    {
      slot: "overview",
      label: "Overview",
    },
    {
      slot: "stake",
      label: "Stake",
    },
    {
      slot: "unstake",
      label: "Unstake",
    },
  ];

  const selected = ref(0);
  const { publicKey } = useWallet();
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.7s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
