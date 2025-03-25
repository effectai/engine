<template>
  <div class="w-full">
    <NodeStatusCard />

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
      <StatisticCard icon="i-lucide-cpu" label="CPU" value="12%" />
      <StatisticCard icon="i-lucide-memory" label="Memory" value="12%" />
      <StatisticCard icon="i-lucide-activity" label="Network" value="12ms" />
      <StatisticCard icon="i-lucide-shield" label="Tasks" value="12" />
    </div>

    <TaskList />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
