import { useQuery, keepPreviousData } from "@tanstack/vue-query";
import { useWorkerStore } from "@/stores/worker";
// import type { WorkerTaskRecord } from "@effectai/protocol";

const activeTask = ref<WorkerTaskRecord | null>(null);

export const useTasks = () => {
  const workerStore = useWorkerStore();
  const { taskCounter } = storeToRefs(workerStore);

  const setActiveTask = (task: WorkerTaskRecord | null) => {
    activeTask.value = task;
  };

  const useGetTasks = (index: Ref<number | string>) => {
    return useQuery({
      queryKey: ["tasks", index, taskCounter],
      queryFn: async () => {
        const tasks = await workerStore.worker?.getTasks({
          prefix: `tasks/${index.value}`,
        });

        return tasks;
      },
      placeholderData: keepPreviousData,
    });
  };

  const useTaskState = (task: WorkerTaskRecord) => {
    return task.events[task.events.length - 1].type;
  };

  const isAccepted = (task: WorkerTaskRecord) => {
    return task.events.some((event) => event.type === "accept");
  };

  const isCompleted = (task: WorkerTaskRecord) => {
    return task.events.some((event) => event.type === "complete");
  };

  const isRejected = (task: WorkerTaskRecord) => {
    return task.events.some((event) => event.type === "reject");
  };

  const renderTask = async (task: WorkerTaskRecord) => {
    return await workerStore.worker?.renderTask({ taskRecord: task });
  };

  const getTaskDeadline = (task: WorkerTaskRecord) => {
    const lastEvent = task.events[task.events.length - 1];
    const now = new Date().getTime() / 1000;

    if (lastEvent.type === "create") {
      return { time: lastEvent.timestamp + 600 - now, type: "accept" };
    }

    if (lastEvent.type === "accept") {
      return { time: lastEvent.timestamp + 600 - now, type: "complete" };
    }

    return { time: 0, type: "none" };
  };

  const completeTask = async (taskId: string, result: string) => {
    await workerStore.worker?.completeTask({
      taskId,
      result,
    });
  };

  const acceptTask = async (taskId: string) => {
    return await workerStore.worker?.acceptTask({ taskId });
  };

  const rejectTask = async (taskId: string, reason: string) => {
    return await workerStore.worker?.rejectTask({ taskId, reason });
  };

  return {
    activeTask,
    useGetTasks,
    setActiveTask,
    isAccepted,
    isCompleted,
    isRejected,
    renderTask,
    completeTask,
    acceptTask,
    getTaskDeadline,
    useTaskState,
    rejectTask,
  };
};
