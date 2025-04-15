import { ManagerTaskStore } from "../stores/managerTaskStore.js";
import { createWorkerQueue } from "./createWorkerQueue.js";

export const createWorkerManager = ({
  taskStore,
}: { taskStore: ManagerTaskStore }) => {
  const workerQueue = createWorkerQueue();

  const getAssignedTasks = async (): Promise<Map<string, string>> => {
    const assignedTasks = new Map<string, string>();
    const allTasks = await taskStore.all();

    for (const task of allTasks) {
      const lastEvent = task.events[task.events.length - 1];
      if (lastEvent.type === "assign") {
        assignedTasks.set(lastEvent.assignedToPeer, task.state.id);
      }
    }

    return assignedTasks;
  };

  const isWorkerAvailable = async (workerId: string): Promise<boolean> => {
    const assignedTasks = await getAssignedTasks();
    return !assignedTasks.has(workerId);
  };

  const getAvailableWorkers = async (): Promise<string[]> => {
    const assignedTasks = await getAssignedTasks();
    return workerQueue.queue.filter((workerId) => !assignedTasks.has(workerId));
  };

  return {
    getAssignedTasks,
    isWorkerAvailable,
    getAvailableWorkers,
  };
};
