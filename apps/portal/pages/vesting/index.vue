<template>
  <div v-if="!address">
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
  <UCard v-else>
    <template #header>
      <h1 class="text-2xl">Vesting Contracts</h1>
    </template>
    <div v-if="!vestingAccounts || vestingAccounts.length == 0">
      <p class="">No active vesting contracts found.</p>
    </div>
    <div v-else>
      <div class="space-y-4">
        <VestingScheduleItem
          v-for="account in vestingAccounts"
          :vesting-account="account"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import { WalletMultiButton } from "solana-wallets-vue";
  const { address } = useSolanaWallet();

  const { useGetVestingAccounts } = useVestingProgram();
  const { data: vestingAccounts } = useGetVestingAccounts();
</script>

<style scoped></style>
