import { decodeTime } from "ulid";
export const useWorkerNode = () => {
  const workerStore = useWorkerStore();
  const { peerId } = storeToRefs(workerStore);

  const { useGetTasks } = useTasks();
  const { data: completedTasks } = useGetTasks(ref("completed"));
  const totalTasksCompleted = computed(() => completedTasks.value?.length || 0);

  const { data: rejectedTasks } = useGetTasks(ref("rejected"));
  const tasksRejected = computed(() => rejectedTasks.value?.length || 0);

  const totalEffectEarnings = computed(() => {
    return (
      Number(
        completedTasks.value?.reduce((total, task) => {
          return total + (task.state.reward || BigInt(0));
        }, BigInt(0)) || 0n,
      ) / 1e6
    );
  });

  const daysInNetwork = computed(() => {
    if (!completedTasks.value || completedTasks.value.length === 0) return 1;
    const firstTaskDate = decodeTime(completedTasks.value?.[0].state.id);

    const firstTask = new Date(firstTaskDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstTask.getTime());

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  //const peformance score is tasks completed / (tasks completed + tasks rejected)
  const performanceScore = computed(() => {
    const completed = totalTasksCompleted.value;
    const rejected = tasksRejected.value;
    if (completed + rejected === 0) return 0; // Avoid division by zero
    return ((completed / (completed + rejected)) * 100).toFixed(2); // Return as a percentage
  });

  return {
    peerId,
    totalTasksCompleted,
    tasksRejected,
    totalEffectEarnings,
    daysInNetwork,
    performanceScore,
  };
};
