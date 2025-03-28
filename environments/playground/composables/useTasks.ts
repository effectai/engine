import type { Task } from "@effectai/protocol";

const activeTask = ref<null | Task>(null);

export const useTasks = () => {
	const { node, taskStore } = useWorkerNode();

	const completeTask = async (taskId: string, result: string) => {
		if (!node.value) return;
		await node.value.services.worker.completeTask(taskId, result);
		await refreshTaskStore();
	};

	const acceptTask = async (taskId: string) => {
		if (!node.value) return;
		await node.value.services.worker.acceptTask(taskId);
		activeTask.value.status = "ACCEPTED";
		await refreshTaskStore();
	};

	const refreshTaskStore = async () => {
		if (!node.value) return;
		taskStore.value = await node.value.services.worker.getTasks();
	};

	const setActiveTask = (task: Task) => {
		activeTask.value = task;
	};

	return {
		taskStore,
		refreshTaskStore,
		completeTask,
		activeTask,
		acceptTask,
		setActiveTask,
	};
};
