import type { Task } from "@effectai/protobufs";
import type { WorkerTaskRecord } from "@effectai/protocol-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

const activeTask = ref<WorkerTaskRecord | null>(null);

export const useTasks = () => {
  const { instance } = storeToRefs(useWorkerStore());

  const setActiveTask = (task: WorkerTaskRecord | null) => {
    activeTask.value = task;
  };

  const useGetTasks = (index: Ref<number | string>) => {
    const { account } = useAuth();

    return useQuery({
      queryKey: ["tasks", index, account],
      queryFn: async () => {
        if (!instance.value) {
          throw new Error("Worker is not initialized");
        }

        const tasks = await instance.value.getTasks({
          prefix: `tasks/${index.value}`,
        });

        return tasks;
      },
    });
  };

  const useGetActiveTasks = (index: Ref<number | string>) => {
    const queryClient = useQueryClient();

    const handleTaskEvent = (event: CustomEvent<Task>) => {
      queryClient.setQueryData<Task[]>(["tasks", index], (old) =>
        old ? [...old, event.detail] : [event.detail],
      );
    };

    const invalidateTasks = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", index] });
    };

    onMounted(() => {
      instance.value?.events.addEventListener("task:created", invalidateTasks);
      instance.value?.events.addEventListener("task:rejected", invalidateTasks);
      instance.value?.events.addEventListener(
        "task:completed",
        invalidateTasks,
      );
    });

    onUnmounted(() => {
      instance.value?.events.removeEventListener(
        "task:created",
        handleTaskEvent,
      );
      instance.value?.events.removeEventListener(
        "task:rejected",
        invalidateTasks,
      );
      instance.value?.events.removeEventListener(
        "task:completed",
        invalidateTasks,
      );
    });

    return useGetTasks(index);
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
    return await instance.value?.renderTask({ taskRecord: task });
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
    await instance.value?.completeTask({
      taskId,
      result,
    });
  };

  const acceptTask = async (taskId: string) => {
    return await instance.value?.acceptTask({ taskId });
  };

  const rejectTask = async (taskId: string, reason: string) => {
    return await instance.value?.rejectTask({ taskId, reason });
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
    useGetActiveTasks,
  };
};
