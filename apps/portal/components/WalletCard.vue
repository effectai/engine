<template>
  <div class="w-full rounded-lg overflow-hidden">
    <div class="">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center space-x-2">
          <UIcon
            class="h-5 w-5 text-black dark:text-white"
            name="lucide:wallet"
          />
          <h2 class="text-2xl font-bold">
            <slot name="title">Wallet Connected</slot>
          </h2>
        </div>
        <UButton
          size="xs"
          :ui="{ rounded: 'rounded-md' }"
          color="gray"
          v-if="props.onDisconnect"
          @click="props.onDisconnect"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Disconnect wallet"
        >
          <UIcon class="h-5 w-5" name="lucide:log-out" />
        </UButton>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4"></p>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >Blockchain:</span
          >
          <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {{ walletMeta.chain }}</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >Wallet:</span
          >
          <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
            <span v-if="walletMeta.icon">
              <img :src="walletMeta.icon" class="h-5 w-5 inline-block mr-1" />
            </span>
            {{ walletMeta.name }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >Address:</span
          >
          <BlockchainAddress class="text-sm" :address="address" />
        </div>
        <div
          class="flex items-center justify-between"
          v-if="walletMeta.permission"
        >
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >Permission:</span
          >
          <BlockchainAddress class="text-sm" :address="walletMeta.permission" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >{{ balance?.symbol }} Balance:</span
          >
          <span class="text-sm text-gray-600 dark:text-gray-400">{{
            (balance && formatNumber(balance.value)) || "-"
          }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >EFX Balance:</span
          >
          <span class="text-sm text-gray-600 dark:text-gray-400">{{
            (efxBalance && formatNumber(efxBalance.value)) || "-"
          }}</span>
        </div>
      </div>
    </div>
    <div class="mt-5 flex justify-between gap-5">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { UseQueryReturnType } from "@tanstack/vue-query";
  import type {
    FormattedBalanceReturnType,
    WalletConnectionMeta,
  } from "~/types/types";

  const props = defineProps<{
    address: string;
    walletMeta: WalletConnectionMeta;
    onDisconnect: () => void;
    efxBalanceQuery: () => UseQueryReturnType<
      FormattedBalanceReturnType,
      Error
    >;
    balanceQuery: () => UseQueryReturnType<FormattedBalanceReturnType, Error>;
  }>();

  const { data: balance } = props.balanceQuery();
  const { data: efxBalance } = props.efxBalanceQuery();
</script>

<style lang="scss" scoped></style>
