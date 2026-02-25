<template>
  <div
    v-if="activeTask"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <UModal v-model:open="isOpen" prevent-close fullscreen>
      <template #content>
        <ShowInformationModal
          v-model="isOpenTaskInfoModal"
          :instructions="currentTaskInstructions"
        />

        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <!-- Title and Timer -->
              <div class="flex flex-col gap-1.5 min-w-0 flex-1">
                <h3
                  class="text-sm sm:text-base font-semibold leading-6 text-gray-900 dark:text-white truncate"
                >
                  {{ activeTask?.state.title }}
                </h3>
                <div
                  class="flex items-center gap-2 text-xs sm:text-sm transition-colors duration-300"
                  :class="timerColorClass"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-timer flex-shrink-0"
                  >
                    <line x1="10" x2="14" y1="2" y2="2"></line>
                    <line x1="12" x2="15" y1="14" y2="11"></line>
                    <circle cx="12" cy="14" r="8"></circle>
                  </svg>
                  <span class="capitalize font-medium">
                    Time remaining to {{ deadlineType }} task: {{ formattedTime }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto sm:flex-shrink-0">
                <!-- Accept/Reject Buttons (shown when task needs to be accepted) -->
                <div class="flex gap-2" v-if="showAcceptTaskButton">
                  <UButton
                    color="neutral"
                    @click.stop="handlerAcceptTask"
                    class="flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <UIcon name="i-heroicons-check-circle-20-solid" />
                    <span class="sm:inline">Accept</span>
                  </UButton>
                  <UButton
                    color="neutral"
                    @click.stop="handlerRejectTask"
                    class="flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <UIcon name="i-heroicons-x-mark-20-solid" />
                    <span class="sm:inline">Reject</span>
                  </UButton>
                </div>

                <!-- Instructions and Close Buttons -->
                <div class="flex gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    @click="isOpenTaskInfoModal = true"
                    class="flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <UIcon name="i-heroicons-information-circle-20-solid" class="sm:hidden" />
                    <span class="hidden sm:inline">Show Instructions</span>
                    <span class="sm:hidden">Instructions</span>
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-x-mark-20-solid"
                    @click="setActiveTask(null)"
                    size="sm"
                    class="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </template>

          <template #default>
            <div
              class="p-3 sm:p-4 overflow-y-auto"
              :class="{ 'opacity-30': taskState === 'create' }"
              v-if="activeTask"
            >
              <TaskTemplate
                ref="template"
                @submit="handlerSubmitTask"
                @ready="isTemplateReady = true"
                @instructions="currentTaskInstructions = $event"
              />
            </div>
          </template>

          <template #footer>
            <div class="flex flex-col sm:flex-row gap-2" v-if="showForceSubmitTaskButton">
              <UButton
                variant="outline"
                color="neutral"
                @click.stop="reportAndSkipTask"
                size="sm"
                class="w-full sm:w-auto"
              >
                <UIcon name="i-heroicons-exclamation-circle-20-solid" />
                <span>Report & Skip Task</span>
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import type TaskTemplate from "./TaskTemplate.vue";
import { TASK_ACCEPTANCE_TIME } from "@effectai/protocol-core";

const {
  activeTask,
  setActiveTask,
  completeTask,
  acceptTask,
  rejectTask,
  renderTask,
  useTaskState,
  getTaskDeadline,
} = useTasks();

// Convert TASK_ACCEPTANCE_TIME from milliseconds to seconds
const TASK_ACCEPTANCE_TIME_SECONDS = TASK_ACCEPTANCE_TIME / 1000;

type TemplateComponent = InstanceType<typeof TaskTemplate>;
const template = ref<TemplateComponent | null>(null);
const isTemplateReady = ref(false);

const isOpen = computed(() => !!activeTask.value);
const isOpenTaskInfoModal = ref(false);
const currentTaskInstructions = ref("");

const taskState = computed(
  () => activeTask.value && useTaskState(activeTask.value),
);

const currentTime = ref(Date.now() / 1000);
let updateInterval: ReturnType<typeof setInterval> | null = null;

watch(isOpen, (open) => {
  if (open) {
    updateInterval = setInterval(() => {
      currentTime.value = Date.now() / 1000;
    }, 1000);
  } else {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}, { immediate: true });

// Clean up interval on unmount
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

const deadlineType = computed(() => {
  if (!activeTask.value) return 'accept';
  return getTaskDeadline(activeTask.value).type;
});

const formattedTime = computed(() => {
  if (!activeTask.value) return '0h 0m 0s';

  // Trigger reactivity on currentTime changes
  currentTime.value;

  // Get the latest deadline calculation
  const deadlineInfo = getTaskDeadline(activeTask.value);
  const remaining = Math.max(deadlineInfo.time, 0);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
});

const timerColorClass = computed(() => {
  if (!activeTask.value) return 'text-zinc-500 dark:text-zinc-400';

  // Trigger reactivity on currentTime changes
  currentTime.value;

  const deadlineInfo = getTaskDeadline(activeTask.value);
  const remaining = Math.max(deadlineInfo.time, 0);

  const lastEvent = activeTask.value.events[activeTask.value.events.length - 1];
  let totalTime: number;

  if (lastEvent.type === 'create') {
    // For acceptance: use TASK_ACCEPTANCE_TIME constant
    totalTime = TASK_ACCEPTANCE_TIME_SECONDS;
  } else if (lastEvent.type === 'accept') {
    // For completion: use task's timeLimitSeconds
    totalTime = Number(activeTask.value.state.timeLimitSeconds ?? 600);
  } else {
    totalTime = TASK_ACCEPTANCE_TIME_SECONDS;
  }

  const percentageRemaining = (remaining / totalTime) * 100;

  if (percentageRemaining <= 20) {
    return 'text-red-500 dark:text-red-400';
  }
  else if (percentageRemaining <= 35) {
    return 'text-yellow-500 dark:text-yellow-400';
  }
  return 'text-zinc-500 dark:text-zinc-400';
});

const showAcceptTaskButton = computed(() => {
  if (!activeTask.value) return false;
  return taskState.value === "create";
});

const showForceSubmitTaskButton = computed(() => {
  if (!activeTask.value) return false;
  return taskState.value !== "create";
});

// Auto-close modal when timer expires
watch(
  () => {
    if (!activeTask.value) return 0;
    currentTime.value; // Trigger reactivity
    return getTaskDeadline(activeTask.value).time;
  },
  (remaining, prevRemaining) => {

    if (remaining <= 0 && prevRemaining > 0) {
      toast.clear();
      toast.add({
        title: 'Task Expired',
        description: 'Time has run out for this task.',
        color: 'error',
      });
      setActiveTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  }
);

const toast = useToast();
const queryClient = useQueryClient();

setActiveTask(null);
const handlerAcceptTask = async () => {
  if (!activeTask.value) return;

  const taskRecord = await acceptTask(activeTask.value.state.id);
  if (!taskRecord) {
    toast.clear();
    toast.add({
      title: "Error",
      color: "error",
      description: "Failed to accept task",
    });
    return;
  }

  toast.clear();
  toast.add({
    title: "Success",
    color: "success",
    description: "Task accepted successfully",
  });

  await queryClient.invalidateQueries({
    queryKey: ["tasks", "active"],
  });

  setActiveTask(taskRecord);
};

const handlerRejectTask = async () => {
  if (!activeTask.value) return;

  await rejectTask(activeTask.value.state.id, "Task rejected by worker");
  toast.clear();
  toast.add({
    title: "Success",
    color: "success",
    description: "Task rejected successfully",
  });

  await queryClient.invalidateQueries({
    queryKey: ["tasks", "active"],
  });

  setActiveTask(null);
};

const reportAndSkipTask = async () => {
  if (!activeTask.value) return;
  await completeTask(activeTask.value.state.id, "<TASK REPORTED AND SKIPPED>");
  toast.clear();
  toast.add({
    title: "Task Reported",
    color: "error",
    description: "Report was submitted and task is skipped.",
  });
  await queryClient.invalidateQueries({
    queryKey: ["tasks"],
  });
  setActiveTask(null);
};

const handlerSubmitTask = async (data: Record<unknown, string | number>) => {
  if (!activeTask.value) return;
  await completeTask(activeTask.value.state.id, JSON.stringify(data));
  toast.clear();
  toast.add({
    title: "Success",
    color: "success",
    description: "Task completed successfully",
  });
  await queryClient.invalidateQueries({
    queryKey: ["tasks"],
  });
  setActiveTask(null);
};

watchEffect(async () => {
  if (!activeTask.value) return;

  const html = await renderTask(activeTask.value);

  if (!html) {
    toast.clear();
    toast.add({
      title: "Error",
      color: "error",
      description: "Failed to render task template",
    });
    return;
  }

  if (template.value) {
    template.value.setHtml(html);
  }
});
</script>

<style scoped></style>
