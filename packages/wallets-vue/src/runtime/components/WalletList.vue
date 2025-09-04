<template>
  <ul role="listbox" class="">
    <li v-for="w in wallets" :key="w.name" role="option">
      <slot name="wallet" :wallet="w" :select="() => emit('select', w.name)">
        <button type="button" @click="emit('select', w.name)">
          {{ w.name }}
        </button>
      </slot>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useWallet } from "../composables/useWallet";
const emit = defineEmits<{ (e: "select", name: string): void }>();
const { wallets } = useWallet();
</script>
