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
import { createWorker } from "@effectai/protocol";
</script>

<style scoped></style>
