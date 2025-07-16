<template>
  <div
    v-if="activeTask"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <UModal v-model:open="isOpen" prevent-close fullscreen>
      <template #content
        ><UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3
                class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {{ activeTask?.state.title }}
              </h3>
              <div class="flex justify-end gap-2">
                <!-- <UButton color="black" variant="outline"> -->
                <!-- Show Instructions -->
                <!-- </UButton> -->
                <div class="flex space-x-2" v-if="showAcceptTaskButton">
                  <UButton color="neutral" @click.stop="handlerAcceptTask">
                    <UIcon name="i-heroicons-check-circle-20-solid" />
                    Accept Task
                  </UButton>
                  <UButton color="neutral" @click.stop="handlerRejectTask">
                    <UIcon name="i-heroicons-x-mark-20-solid" />
                    Reject Task
                  </UButton>
                </div>
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-x-mark-20-solid"
                  class="-my-1"
                  @click="setActiveTask(null)"
                />
              </div>
            </div>
          </template>

          <template #footer>
            <div class="flex space-x-2" v-if="showForceSubmitTaskButton">
              <UButton
                variant="outline"
                color="neutral"
                @click.stop="reportAndSkipTask"
              >
                <UIcon name="i-heroicons-exclamation-circle-20-solid" />
                Report & Skip Task
              </UButton>
            </div>
          </template>

          <template #default>
            <div
              class="p-4"
              :class="{ 'opacity-30': taskState === 'create' }"
              v-if="activeTask"
            >
              <WorkerTaskTemplate
                ref="template"
                @submit="handlerSubmitTask"
                @ready="isTemplateReady = true"
              />
            </div>
          </template> </UCard
      ></template>
    </UModal>
  </div>
</template>
<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import type TaskTemplate from "./TaskTemplate.vue";

const {
  activeTask,
  setActiveTask,
  completeTask,
  acceptTask,
  rejectTask,
  renderTask,
  useTaskState,
} = useTasks();

type TemplateComponent = InstanceType<typeof TaskTemplate>;
const template = ref<TemplateComponent | null>(null);
const isTemplateReady = ref(false);

const isOpen = computed(() => !!activeTask.value);

const taskState = computed(
  () => activeTask.value && useTaskState(activeTask.value),
);

const showAcceptTaskButton = computed(() => {
  if (!activeTask.value) return false;
  return taskState.value === "create";
});

const showForceSubmitTaskButton = computed(() => {
  if (!activeTask.value) return false;
  return taskState.value !== "create";
});

const toast = useToast();
const queryClient = useQueryClient();

setActiveTask(null);
const handlerAcceptTask = async () => {
  if (!activeTask.value) return;

  const taskRecord = await acceptTask(activeTask.value.state.id);
  if (!taskRecord) {
    toast.add({
      title: "Error",
      color: "error",
      description: "Failed to accept task",
    });
    return;
  }

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
