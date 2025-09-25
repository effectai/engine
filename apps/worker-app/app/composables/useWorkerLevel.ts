import { computed, unref, type Ref } from "vue";

/**
 * Linear leveling:
 *   experience = tasks * taskPoints + capabilities * capabilityPoints
 *   level      = floor(experience / stepPerLevel) + 1   (capped by maxLevel if provided)
 *   progress%  = (experience - expMinForLevel) / stepPerLevel * 100
 */

const options = {
  taskPoints: 100, // points per completed task
  capabilityPoints: 18000, // points per capability (worth more)
  stepPerLevel: 25_000, // experience needed per level (constant, i.e. linear)
  maxLevel: 100, // hard cap
};

export function useWorkerLevel() {
  const {
    taskPoints = 100,
    capabilityPoints = 4000,
    stepPerLevel = 25_000,
    maxLevel, // e.g., 50
  } = options ?? {};

  const { useGetTasks } = useTasks();
  const { data: completedTasks } = useGetTasks(ref("completed"));
  const totalTasksCompleted = computed(() => completedTasks.value?.length || 0);

  const tasks = computed(() => Number(unref(totalTasksCompleted) ?? 0));
  const { userCapabilities } = useCapabilities();

  const caps = computed(() => {
    const v = unref(userCapabilities) as unknown;
    if (Array.isArray(v)) return v.length;
    return Number(v ?? 0);
  });

  const experience = computed(() => {
    return tasks.value * taskPoints + caps.value * capabilityPoints;
  });

  const level = computed(() => {
    const lvl = Math.floor(experience.value / stepPerLevel) + 1;
    return maxLevel ? Math.min(lvl, maxLevel) : lvl;
  });

  const currentLevelExpMin = computed(() => {
    const effectiveLevel = maxLevel
      ? Math.min(level.value, maxLevel)
      : level.value;
    return (effectiveLevel - 1) * stepPerLevel;
  });

  const nextLevelExp = computed(() => {
    const next = level.value * stepPerLevel;

    return maxLevel && level.value >= maxLevel
      ? currentLevelExpMin.value + stepPerLevel
      : next;
  });

  const progress = computed(() => {
    const gainedThisLevel = experience.value - currentLevelExpMin.value;
    const pct = (gainedThisLevel / stepPerLevel) * 100;
    return Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  });

  return {
    taskPoints,
    capabilityPoints,
    stepPerLevel,
    maxLevel,

    // state
    tasks,
    caps,

    // computed leveling data
    experience,
    level,
    progress, // 0–100
    currentLevelExpMin, // floor XP for this level
    nextLevelExp, // XP threshold for next level
  };
}
