<template>
  <UCard class="hover:shadow-lg hover:shadow-emerald-400/10">
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
        class="lucide lucide-list-todo text-emerald-400 animate-pulse"
      >
        <rect x="3" y="5" width="6" height="6" rx="1"></rect>
        <path d="m3 17 2 2 4-4"></path>
        <path d="M13 6h8"></path>
        <path d="M13 12h8"></path>
        <path d="M13 18h8"></path>
      </svg>
      <span
        class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
      >
        ACTIVE TASKS
      </span>
      <UBadge v-if="tasks" color="emerald" variant="soft" class="ml-auto">
        {{ tasks.length }} active
      </UBadge>
    </h2>

    <div
      v-if="tasks && tasks.length === 0"
      class="text-center py-8 text-zinc-400"
    >
      <UIcon
        name="i-heroicons-list-bullet-20-solid"
        class="text-3xl mx-auto mb-2"
      />
      <p>Waiting for tasks...</p>
    </div>

    <TransitionGroup name="list" tag="div" class="space-y-3">
      <div
        v-for="(task, index) in tasks"
        :key="task.state.id"
        class="flex justify-between border border-zinc-700 rounded-lg overflow-hidden duration-300 hover:border-emerald-400/50 hover:shadow-md hover:shadow-emerald-400/10 transition-transform"
      >
        <WorkerTaskListItem
          :task-record="task"
          class="transition-transform duration-300 hover:scale-[1.005]"
        />
      </div>
    </TransitionGroup>
  </UCard>
</template>

<script setup lang="ts">
const { useGetActiveTasks } = useTasks();
const { data: tasks = [] } = useGetActiveTasks(ref("active"));
</script>

<style scoped>
  .list-move,
/* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
  }

  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  /* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
  .list-leave-active {
    position: absolute;
  }
</style>
