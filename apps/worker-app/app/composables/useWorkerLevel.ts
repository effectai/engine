/**
 * Exponential leveling:
 *   experience = tasks * taskPoints + capabilities * capabilityPoints
 *   XP to advance from level L -> L+1 = baseStep * growth^(L-1)
 *   cumulative XP to reach level L = baseStep * (growth^(L-1) - 1) / (growth - 1)
 *   level = floor( 1 + log( (experience*(growth-1))/baseStep + 1 ) / log(growth) ), capped
 *   progress% = (experience - expMinForLevel(level)) / xpToNextLevel(level) * 100
 */

type LevelingOptions = {
  taskPoints?: number; // points per completed task
  capabilityPoints?: number; // points per capability (worth more)
  baseStep?: number; // XP needed for level 1 -> 2
  growth?: number; // growth factor per level (e.g. 1.25)
  maxLevel?: number; // hard cap (optional)
};

const defaultOptions: Required<Omit<LevelingOptions, "maxLevel">> = {
  taskPoints: 100,
  capabilityPoints: 18_000,
  baseStep: 25_000,
  growth: 1.25, // must be > 1 for exponential progression
};

export function useWorkerLevel(opts?: LevelingOptions) {
  const { taskPoints, capabilityPoints, baseStep, growth } = {
    ...defaultOptions,
    ...opts,
  };

  const maxLevel = opts?.maxLevel;

  // --- Sources ---
  const { useGetTasks } = useTasks();
  const { data: completedTasks } = useGetTasks(ref("completed"));
  const totalTasksCompleted = computed(() => completedTasks.value?.length ?? 0);
  const tasks = computed(() => Number(unref(totalTasksCompleted) ?? 0));

  const { userCapabilities } = useCapabilities();
  const caps = computed(() => {
    const v = unref(userCapabilities) as unknown;
    if (Array.isArray(v)) return v.length;
    return Number(v ?? 0);
  });

  // --- XP gains ---
  const experience = computed(() => {
    return tasks.value * taskPoints + caps.value * capabilityPoints;
  });

  // --- Helpers for exponential thresholds ---
  // XP to go from level L to L+1
  const xpToNextLevel = (L: number) =>
    baseStep * Math.pow(growth, Math.max(0, L - 1));

  // cumulative XP required to *reach* level L (i.e., floor for that level)
  const expMinForLevelFn = (L: number) => {
    if (L <= 1) return 0;
    // geometric series sum: base * (g^(L-1)-1)/(g-1)
    return (baseStep * (Math.pow(growth, L - 1) - 1)) / (growth - 1);
  };

  // invert cumulative XP -> level
  const levelFromExp = (xp: number) => {
    if (xp <= 0) return 1;
    // Solve: xp = base * (g^(L-1)-1)/(g-1)
    // => g^(L-1) = (xp*(g-1))/base + 1
    const rhs = (xp * (growth - 1)) / baseStep + 1;
    const raw = 1 + Math.floor(Math.log(rhs) / Math.log(growth));
    return Math.max(1, raw);
  };

  const level = computed(() => {
    const lvl = levelFromExp(experience.value);
    return maxLevel ? Math.min(lvl, maxLevel) : lvl;
  });

  const currentLevelExpMin = computed(() => {
    const effective = maxLevel ? Math.min(level.value, maxLevel) : level.value;
    return expMinForLevelFn(effective);
  });

  const currentLevelStep = computed(() => {
    // XP needed to go from current level to next (constant for the level)
    const effective = maxLevel ? Math.min(level.value, maxLevel) : level.value;
    return xpToNextLevel(effective);
  });

  const nextLevelExp = computed(() => {
    // cumulative XP threshold for *next* level
    const nextLevel = level.value + 1;
    const cappedNext =
      maxLevel && nextLevel > maxLevel ? maxLevel + 1 : nextLevel;
    // If capped at max, show "virtual" next threshold so progress stays well-defined
    return expMinForLevelFn(cappedNext);
  });

  const progress = computed(() => {
    const gainedThisLevel = experience.value - currentLevelExpMin.value;
    const step = currentLevelStep.value || 1;
    const pct = (gainedThisLevel / step) * 100;
    // If at hard cap, clamp at 100%
    const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
    if (maxLevel && level.value >= maxLevel) return 100;
    return clamped;
  });

  return {
    // config
    taskPoints,
    capabilityPoints,
    baseStep,
    growth,
    maxLevel,

    // state
    tasks,
    caps,

    // computed leveling data
    experience,
    level,
    progress, // 0–100

    currentLevelExpMin, // cumulative XP floor for current level
    nextLevelExp, // cumulative XP threshold for next level
    currentLevelStep, // XP needed to level up from current level
  };
}
