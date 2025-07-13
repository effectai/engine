<template>
  <div
    class="b-border-b border-1 border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
    :ui="{ color: 'primary' }"
  >
    <div class="flex flex-col sm:items-center gap-2 sm:gap-4 font-mono text-sm">
      <div
        class="flex items-center gap-1 text-gray-500 dark:text-gray-400"
      ></div>
      <div class="flex items-center gap-1">
        <UBadge leading-icon="i-heroicons-tag" color="orange" size="sm"
          >alpha v{{ version }}
        </UBadge>
      </div>

      <div class="flex items-center gap-1">
        <UIcon name="i-heroicons-server" class="w-4 h-4 text-gray-400" />
        <span
          class="text-gray-900 dark:text-gray-200"
          v-if="announcedAddresses"
        >
          {{ extractHost(announcedAddresses[0]) }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <UIcon name="i-heroicons-finger-print" class="w-4 h-4 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300" v-if="peerId">
          {{ sliceBoth(peerId) }}
        </span>
      </div>

      <div class="flex items-center gap-1" v-if="latency">
        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          {{ latency || "~" }} ms
        </span>
      </div>
      <UButton color="neutral" size="xs">Connect</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
  url: string;
  version: string;
  region: string;
  peerId: string;
  announcedAddresses: string[];
}>();

const extractHost = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return url; // Fallback to the original URL if parsing fails
  }
};
</script>

<style scoped></style>
