<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { install } from "@solana/webcrypto-ed25519-polyfill";
install();
</script>
