import type { Task } from "@effectai/protobufs";
import type { WorkerTaskRecord } from "@effectai/protocol-core";
import { TASK_ACCEPTANCE_TIME } from "@effectai/protocol-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

const activeTask = ref<WorkerTaskRecord | null>(null);

// Convert TASK_ACCEPTANCE_TIME from milliseconds to seconds
const TASK_ACCEPTANCE_TIME_SECONDS = TASK_ACCEPTANCE_TIME / 1000;

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
      instance.value?.events.addEventListener("task:created", handleTaskEvent);
      instance.value?.events.addEventListener("task:rejected", invalidateTasks);
      instance.value?.events.addEventListener(
        "task:completed",
        invalidateTasks,
      );
      instance.value?.events.addEventListener(
        "task:expired",
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
      instance.value?.events.removeEventListener(
        "task:expired",
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
      // Use TASK_ACCEPTANCE_TIME for accepting tasks
      return {
        time: Math.max(lastEvent.timestamp + TASK_ACCEPTANCE_TIME_SECONDS - now, 0),
        type: "accept",
      };
    }

    if (lastEvent.type === "accept") {
      // Use task-specific timeLimitSeconds for completing tasks
      const timeLimitSeconds = Number(task.state.timeLimitSeconds ?? 600);
      return {
        time: Math.max(lastEvent.timestamp + timeLimitSeconds - now, 0),
        type: "complete",
      };
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
