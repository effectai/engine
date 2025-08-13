<template>
  <a target="_blank" :href="`https://solscan.io/${type}/${hash}`">
    <UButton color="black" variant="outline">
      <UIcon name="lucide:external-link" class="h-4 w-4" />
      View on Explorer
    </UButton>
  </a>
</template>

<script setup lang="ts">
  const props = defineProps({
    type: {
      type: String,
      default: "tx",
    },
    hash: {
      required: true,
      type: String,
    },
  });
</script>

<style scoped></style>
