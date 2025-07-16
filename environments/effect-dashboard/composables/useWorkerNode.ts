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

  const useWorkerLevel = () => {
    const level = computed(() => {
      const totalTasks = totalTasksCompleted.value;
      if (totalTasks < 10) return 1;
      if (totalTasks < 50) return 2;
      if (totalTasks < 100) return 3;
      if (totalTasks < 200) return 4;
      return 5;
    });

    const experiencePerLevel = computed(() => {
      return {
        1: 25000,
        2: 50000,
        3: 100000,
        4: 200000,
        5: 500000,
      };
    });

    const progress = computed(() => {
      const currentLevel = level.value;
      const currentExperience = Number(totalEffectEarnings.value);
      const requiredExperience =
        experiencePerLevel.value[currentLevel] || 25000;

      return ((currentExperience + 1) / requiredExperience) * 100;
    });

    return {
      level,
      progress,
      experience: totalEffectEarnings.value,
      experiencePerLevel: experiencePerLevel.value,
    };
  };
  const daysInNetwork = computed(() => {
    const firstTaskDate = completedTasks.value?.[0]?.createdAt;
    if (!firstTaskDate) return 0;

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
    useWorkerLevel,
  };
};
