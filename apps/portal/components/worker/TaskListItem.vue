<template>
  <div
    class="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left w-full px-4 py-3 border-gray-300 rounded-lg cursor-pointer hover:opacity-75 transition"
    role="button"
    @click="setActiveTask(props.taskRecord)"
  >
    <!-- Left Side (Stacked on mobile) -->
    <div class="flex items-start sm:items-center gap-3 mb-3 sm:mb-0">
      <div class="space-y-2 text-center sm:text-left">
        <span class="text-base sm:text-lg font-semibold">{{ taskRecord.state.title }}</span>
        <div
          class="capitalize text-sm text-zinc-500 flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-timer"
          >
            <line x1="10" x2="14" y1="2" y2="2"></line>
            <line x1="12" x2="15" y1="14" y2="11"></line>
            <circle cx="12" cy="14" r="8"></circle>
          </svg>
          Time remaining to {{ type }} task: {{ formattedTime }}
        </div>
      </div>
    </div>

    <!-- Right Side (Moves below on mobile) -->
    <div class="flex items-center gap-3 text-sm sm:text-base">
      <div class="text-emerald-500 font-medium">
        {{ formatBigIntToAmount(taskRecord.state?.reward) }} EFFECT
      </div>
      <span v-if="taskState === 'create'">PREVIEW</span>
      <span v-else-if="taskState === 'accept'">CONTINUE</span>
      <UIcon name="i-heroicons-arrow-right" />
    </div>
  </div>
</template>


<script setup lang="ts">
import type { WorkerTaskRecord } from "@effectai/worker";
import { useCountdown } from "@vueuse/core";
const { setActiveTask, getTaskDeadline, useTaskState } = useTasks();

const props = defineProps<{
  taskRecord: WorkerTaskRecord;
}>();

const taskState = useTaskState(props.taskRecord);
const { time, type } = getTaskDeadline(props.taskRecord);
const countdown = useCountdown(time, {
  immediate: true,
});

const formattedTime = computed(() => {
  const time = countdown.remaining.value;
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
});
</script>

<style scoped></style>
