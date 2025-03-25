<template>
  <UCard class="bg-zinc-800 text-white">
    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-list-todo text-emerald-400"
      >
        <rect x="3" y="5" width="6" height="6" rx="1"></rect>
        <path d="m3 17 2 2 4-4"></path>
        <path d="M13 6h8"></path>
        <path d="M13 12h8"></path>
        <path d="M13 18h8"></path></svg
      >ACTIVE TASKS
    </h2>
    <div
      v-for="task in sortedTasks"
      class="flex items-center justify-between border border-zinc-700 p-3 rounded my-3"
    >
      <div class="flex items-center gap-3">
        <div class="space-y-3">
          <span>{{ task.title }}</span>
          <div class="text-sm text-zinc-400 flex items-center gap-1 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-timer"
            >
              <line x1="10" x2="14" y1="2" y2="2"></line>
              <line x1="12" x2="15" y1="14" y2="11"></line>
              <circle cx="12" cy="14" r="8"></circle></svg
            >Time remaining: 10:00
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-emerald-400 font-medium">
          {{ formatBigIntToAmount(task.reward) }} EFFECT
        </div>
        <UButton
          v-if="task.status !== 'COMPLETED'"
          @click="setActiveTask(task)"
          color="white"
          class="btn btn-primary"
          variant="outline"
        >
          VIEW TASK
          <UIcon name="i-heroicons-arrow-right" />
        </UButton>
        <UBadge v-else variant="outline" class="text-white font-medium"
          >COMPLETED</UBadge
        >
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const { taskStore } = useWorkerNode();
const { setActiveTask } = useTasks();

//sort tasks by status, show all created tasks first, then completed, then rejected
const sortedTasks = computed(() =>
	taskStore.value.toSorted((a, b) => {
		if (a.status === "CREATED" && b.status !== "CREATED") return -1;
		if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
		if (a.status === "REJECTED" && b.status !== "REJECTED") return 1;
		return 0;
	}),
);
</script>

<style scoped></style>
