<template>
  <div>
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
const { node } = await useWorkerNode();

definePageMeta({
	layout: "worker",
});

const { taskStore } = await useWorkerNode();
const route = useRoute();
const taskId = route.params.id as string;

const handlerSubmitTask = async (data) => {
	const task = await node.value.services.worker.completeTask(
		taskId,
		JSON.stringify({
			...data.values,
			worker: node.value.peerId.toString(),
		}),
	);

	//redirect to dashboard
	navigateTo("/");
};

onMounted(() => {
	if (template.value) {
		template.value.setHtml(
			taskStore.value.find((task) => task.id === taskId)?.template || "",
		);
	}
});
</script>
