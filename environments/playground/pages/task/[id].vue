<template>
  <div>
    <span class="text-sm"
      ><nuxt-link class="underline text-blue-500" to="/">Dashboard </nuxt-link>
      / <span class="font-bold">{{ taskId }}</span></span
    >
    <UDivider class="my-5" />
    <TaskTemplate
      ref="template"
      @submit="handlerSubmitTask"
      @ready="isTemplateReady = true"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaskTemplate } from "#components";

type TemplateComponent = InstanceType<typeof TaskTemplate>;
const template = ref<TemplateComponent | null>(null);
const isTemplateReady = ref(false);

definePageMeta({
	layout: "worker",
});

const route = useRoute();
const taskId = route.params.id as string;
const { completeTask, taskStore } = useTasks();

const handlerSubmitTask = async (data) => {
	await completeTask(taskId, JSON.stringify({ ...data.values }));
	navigateTo("/");
};

onMounted(() => {
	if (template.value) {
		template.value.setHtml(
			taskStore.value.find((task) => task.taskId === taskId)?.template || "",
		);
	}
});
</script>
