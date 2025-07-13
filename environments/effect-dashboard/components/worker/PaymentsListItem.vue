<template>
  <div>
    <div class="flex items-center justify-between p-2 border-b border-gray-400">
      <div class="flex items-center space-x-2">
        <div class="text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-check-circle w-3 h-3"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium">{{ amount }} EFFECT</p>
          <p class="text-xs text-gray-500">{{ label }}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-600">mgr.alpha.effect.ai</p>
        <p class="text-xs text-gray-500">Jan 21, 10:30 AM</p>
        <UButton
          color="primary"
          size="xs"
          class="mt-1"
          @click="$emit('viewDetails', props.id)"
        >
          View Details
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  label: string;
}>();
</script>

<style scoped></style>
