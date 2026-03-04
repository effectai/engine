<template>
  <UCard>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">TASK POSTER STATUS</h2>
      <div class="flex items-center gap-2">
        <UBadge
          v-if="stats"
          :color="hasAvailableTasks ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ hasAvailableTasks ? "Tasks Available" : "No Tasks" }}
        </UBadge>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-refresh-cw"
          :loading="isLoading"
          @click="refresh"
        />
      </div>
    </div>

    <div v-if="isLoading && !stats" class="flex items-center justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="animate-spin" size="24" />
    </div>

    <div v-else-if="error" class="text-center py-4">
      <p class="text-zinc-400 text-sm">Unable to connect to task poster</p>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="mt-2"
        @click="refresh"
      >
        Retry
      </UButton>
    </div>

    <template v-else-if="stats">
      <!-- <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div class="text-center p-3 border border-zinc-700 rounded">
          <div class="text-2xl font-bold">{{ stats.activeDatasets }}</div>
          <div class="text-xs text-zinc-400">Active Datasets</div>
        </div>
        <div class="text-center p-3 border border-zinc-700 rounded">
          <div class="text-2xl font-bold text-amber-500">
            {{ stats.tasksQueued }}
          </div>
          <div class="text-xs text-zinc-400">Queued</div>
        </div>
        <div class="text-center p-3 border border-zinc-700 rounded">
          <div class="text-2xl font-bold text-blue-500">
            {{ stats.tasksActive }}
          </div>
          <div class="text-xs text-zinc-400">In Progress</div>
        </div>
        <div class="text-center p-3 border border-zinc-700 rounded">
          <div class="text-2xl font-bold text-emerald-500">
            {{ stats.tasksCompleted }}
          </div>
          <div class="text-xs text-zinc-400">Completed</div>
        </div>
      </div> -->

      <div v-if="stats.datasets && stats.datasets.length > 0">
        <h3 class="text-sm font-semibold text-zinc-400 mb-2">DATASETS</h3>
        <div class="space-y-2">
          <div
            v-for="dataset in stats.datasets"
            :key="dataset.id"
            class="p-3 border border-zinc-700 rounded"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ dataset.name }}</span>
                <UBadge
                  v-if="dataset.tasksQueued > 0 || dataset.tasksActive > 0"
                  color="success"
                  variant="subtle"
                  size="xs"
                >
                  Active
                </UBadge>
              </div>
              <div v-if="dataset.tasksActive > 0" class="flex items-center gap-1.5 text-sm text-blue-500">
                <UIcon name="i-lucide-play" size="14" class="animate-pulse" />
                <span class="font-mono font-medium">{{ dataset.tasksActive }}</span>
                <span class="hidden sm:inline">active</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="text-amber-500" size="14" />
                  <span class="font-mono font-medium">{{ dataset.tasksQueued }}</span>
                  <span class="text-zinc-500">queued</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-play" class="text-blue-500" size="14" />
                  <span class="font-mono font-medium">{{ dataset.tasksActive }}</span>
                  <span class="text-zinc-500">active</span>
                </div>
              </div>
              <button
                v-if="dataset.steps && dataset.steps.length > 0"
                class="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                @click="toggleDataset(dataset.id)"
              >
                <span>steps</span>
                <UIcon
                  :name="expandedDatasets.has(dataset.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  size="16"
                />
              </button>
            </div>

            <!-- Collapsible Steps Section -->
            <div
              v-if="expandedDatasets.has(dataset.id) && dataset.steps && dataset.steps.length > 0"
              class="mt-3 pt-3 border-t border-zinc-700 space-y-2"
            >
              <div
                v-for="step in dataset.steps"
                :key="step.index"
                :class="[
                  'pl-3 border-l-2 py-1',
                  step.tasksActive > 0 || step.tasksQueued > 0
                    ? 'border-blue-500'
                    : 'border-zinc-600'
                ]"
              >
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ step.name || `Step ${step.index + 1}` }}</span>
                    <UIcon
                      v-if="step.tasksActive > 0"
                      name="i-lucide-play"
                      class="text-blue-500 animate-pulse"
                      size="12"
                    />
                  </div>
                  <span v-if="step.timeLimitSeconds" class="text-xs text-zinc-500 font-mono">
                    {{ step.timeLimitSeconds }}s
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-clock" class="text-amber-500" size="12" />
                    <span class="font-mono">{{ step.tasksQueued }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-play" class="text-blue-500" size="12" />
                    <span class="font-mono">{{ step.tasksActive }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!hasAvailableTasks" class="text-center text-zinc-400 text-sm mt-4">
        No tasks are currently available. Check back later.
      </p>
    </template>
  </UCard>
</template>

<script setup lang="ts">
interface StepStats {
  index: number;
  name: string;
  type: string;
  tasksQueued: number;
  tasksActive: number;
  tasksCompleted: number;
  timeLimitSeconds: number;
}

interface DatasetStats {
  id: number;
  name: string;
  tasksQueued: number;
  tasksActive: number;
  tasksCompleted: number;
  timeLimitSeconds: number;
  steps: StepStats[];
}

interface TaskPosterStats {
  activeDatasets: number;
  tasksQueued: number;
  tasksActive: number;
  tasksCompleted: number;
  datasets: DatasetStats[];
}

const expandedDatasets = ref<Set<number>>(new Set());

const toggleDataset = (id: number) => {
  if (expandedDatasets.value.has(id)) {
    expandedDatasets.value.delete(id);
  } else {
    expandedDatasets.value.add(id);
  }
};

const config = useRuntimeConfig();
const taskPosterUrl = config.public.TASK_POSTER_URL as string;

const stats = ref<TaskPosterStats | null>(null);
const isLoading = ref(true);
const error = ref(false);

const hasAvailableTasks = computed(
  () => stats.value && (stats.value.tasksQueued > 0 || stats.value.tasksActive > 0)
);

const fetchStats = async () => {
  if (!taskPosterUrl) {
    error.value = true;
    isLoading.value = false;
    return;
  }

  try {
    const response = await fetch(`${taskPosterUrl}/api/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    stats.value = await response.json();
    error.value = false;
  } catch (e) {
    console.error("Failed to fetch task poster stats:", e);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

const refresh = () => {
  isLoading.value = true;
  error.value = false;
  fetchStats();
};

onMounted(() => {
  fetchStats();
});

const pollInterval = ref<ReturnType<typeof setInterval> | null>(null);

onMounted(() => {
  pollInterval.value = setInterval(fetchStats, 30000);
});

onUnmounted(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
  }
});
</script>
