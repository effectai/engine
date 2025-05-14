<template>
  <div class="flex items-center gap-3">
    <div class="space-y-3">
      <span>{{ taskRecord.state.title }}</span>
      <div
        class="capitalize text-sm text-zinc-400 flex items-center gap-1 mt-1"
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
          <circle cx="12" cy="14" r="8"></circle></svg
        >Time remaining to {{ type }} task:
        {{ formattedTime }}
      </div>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <div class="text-emerald-400 font-medium">
      {{ taskRecord.state?.reward }} EFFECT
    </div>

    <UButton
      @click="setActiveTask(props.taskRecord)"
      color="white"
      class="btn btn-primary"
      variant="outline"
    >
      <span v-if="taskState === 'create'">PREVIEW</span>
      <span v-else-if="taskState === 'accept'">CONTINUE</span>
      <UIcon name="i-heroicons-arrow-right" />
    </UButton>
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
