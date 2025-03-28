<template>
  <div>
    <UModal v-model="isOpen" prevent-close fullscreen>
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              {{ activeTask?.title }}
              {{ activeTask?.status }}
            </h3>
            <UButton> Show Instructions </UButton>
            <div class="flex space-x-2">
              <UButton @click.stop="acceptTask(activeTask.taskId)">
                Accept Task
              </UButton>
              <UButton color="red"> Reject Task </UButton>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="setActiveTask(null)"
            />
          </div>
        </template>

        <template #default>
          <div class="p-4 opacity-30">
            <TaskTemplate
              ref="template"
              @submit="handlerSubmitTask"
              @ready="isTemplateReady = true"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
<script setup lang="ts">
import type { Task } from "@effectai/protocol";
import { useVModel } from "@vueuse/core";
import type TaskTemplate from "./TaskTemplate.vue";
const { setActiveTask, activeTask } = useTasks();

type TemplateComponent = InstanceType<typeof TaskTemplate>;
const template = ref<TemplateComponent | null>(null);
const isTemplateReady = ref(false);

const props = defineProps<{
	activeTask: Task | null;
}>();
const emit = defineEmits(["update:activeTask"]);

const task = useVModel(props, "activeTask", emit);
const isOpen = computed(() => !!task.value);

const { completeTask, taskStore, acceptTask } = useTasks();

const toast = useToast();
const handlerSubmitTask = async (data) => {
	console.log(activeTask.value);
	if (activeTask.value?.status !== "ACCEPTED") {
		//TODO:: show error message
		toast.add({
			title: "Error",
			description: "You need to accept the task first",
			color: "red",
		});
		return;
	}
	await completeTask(task.value.taskId, JSON.stringify({ ...data.values }));
	setActiveTask(null);
};

watchEffect(() => {
	if (!activeTask.value) return;
	if (template.value) {
		template.value.setHtml(
			taskStore.value.find((t) => t.taskId === task.value.taskId)?.template ||
				"",
		);
	}
});
</script>

<style scoped></style>
