<template>
  <div
    class="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left w-full px-4 py-3 border-gray-300 rounded-lg cursor-pointer hover:opacity-75 transition"
    role="button"
    @click="setActiveTask(props.taskRecord)"
  >
    <div class="flex items-start sm:items-center gap-3 mb-3 sm:mb-0">
      <div class="space-y-2 text-center sm:text-left">
        <span class="text-base sm:text-lg font-semibold">{{ taskRecord.state.title }}</span>
        <div
          class="capitalize text-sm flex items-center gap-1 transition-colors duration-300 font-medium"
          :class="timerColorClass"
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
import { TASK_ACCEPTANCE_TIME } from "@effectai/protocol-core";

const { setActiveTask, getTaskDeadline, useTaskState } = useTasks();

// Convert TASK_ACCEPTANCE_TIME from milliseconds to seconds
const TASK_ACCEPTANCE_TIME_SECONDS = TASK_ACCEPTANCE_TIME / 1000;

const props = defineProps<{
  taskRecord: WorkerTaskRecord;
}>();

// Make taskState reactive to prop changes
const taskState = computed(() => useTaskState(props.taskRecord));

// Make deadline reactive to prop changes - this recalculates when task state changes
const deadline = computed(() => getTaskDeadline(props.taskRecord));
const type = computed(() => deadline.value.type);

// Update current time every second to trigger reactivity
const currentTime = ref(Date.now() / 1000);
const updateInterval = setInterval(() => {
  currentTime.value = Date.now() / 1000;
}, 1000);

onUnmounted(() => {
  clearInterval(updateInterval);
});

const formattedTime = computed(() => {
  // Just triggers reactivity on currentTime changes
  const now = currentTime.value;

  // Get the latest deadline calculation
  const deadlineInfo = getTaskDeadline(props.taskRecord);
  const remaining = Math.max(deadlineInfo.time, 0);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
});

// Calculate timer color based on percentage of time remaining
const timerColorClass = computed(() => {

  // Triggers reactivity again
  currentTime.value;

  const deadlineInfo = getTaskDeadline(props.taskRecord);
  const remaining = Math.max(deadlineInfo.time, 0);
  const lastEvent = props.taskRecord.events[props.taskRecord.events.length - 1];
  
  if (!lastEvent) return 'text-zinc-500';

  let totalTime: number;

  if (lastEvent.type === 'create') {
    // For acceptance: use TASK_ACCEPTANCE_TIME constant
    totalTime = TASK_ACCEPTANCE_TIME_SECONDS;
  } else if (lastEvent.type === 'accept') {
    // For completion: use task's timeLimitSeconds (gotten from taskposter)
    totalTime = Number(props.taskRecord.state.timeLimitSeconds ?? 600);
  } else {
    totalTime = TASK_ACCEPTANCE_TIME_SECONDS;
  }

  const percentageRemaining = (remaining / totalTime) * 100;

  if (percentageRemaining <= 20) {
    return 'text-red-500';
  }
  else if (percentageRemaining <= 35) {
    return 'text-yellow-500';
  }
  return 'text-zinc-500';
});
</script>

<style scoped></style>
