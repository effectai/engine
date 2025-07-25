<template>
  <UCard class="max-h-[420px] overflow-y-scroll mb-4" variant="mono">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="mdi-lightbulb-on"
          class="text-gray-500 dark:text-gray-400 w-6 h-6"
        />
        <h2 class="text-lg font-semibold">My Capabilities</h2>
      </div>
    </template>
    <div>
      <ul>
        <li
          v-for="capability in capabilities"
          :key="capability.id"
          class="p-4 border-b border-gray-400 dark:border-gray-700 last:border-0"
        >
          <div class="flex items-center gap-2">
            <UIcon
              v-if="capability.icon"
              :name="capability.icon"
              class="text-2xl"
            />
            <div class="flex flex-col text-sm">
              <span class="font-semibold">{{ capability.name }}</span>
              <div class="flex items-center gap-1">
                <span class="text-gray-500 text-sm">{{
                  capability.category
                }}</span>
                <div>{{ capability.value }}</div>
              </div>
            </div>
          </div>
          <div class="text-sm text-gray mt-2">
            Tasks: {{ capability.totalTasks }} | Earned:
            {{ capability.totalEarned }}
            <span v-if="capability.popularity">
              | Popularity: {{ capability.popularity }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const capabilities = ref([
  {
    id: 1,
    name: "Dutch Language",
    value: "Native",
    category: "Language",
    totalTasks: 84,
    totalEarned: 500,
    icon: "mdi-language",
  },
  {
    id: 2,
    name: "English Language",
    value: "Fluent",
    category: "Language",
    totalTasks: 120,
    icon: "mdi-language",
    totalEarned: "500",
  },
  {
    id: 3,
    name: "Nvidia GPU",
    value: "RTX 3080",
    popularity: 8,
    category: "Hardware",
    totalTasks: 50,
    totalEarned: "500",
    icon: "mdi-gpu",
  },
  {
    id: 4,
    name: "Processor",
    value: "Threadripper 3990X",
    category: "Device",
    totalTasks: 30,
    totalEarned: "500",
    popularity: 5,
    icon: "mdi-chip",
  },
  {
    id: 5,
    name: "Geolocation",
    value: "Enabled",
    category: "Device",
    totalEarned: "500",
    popularity: 5,
    totalTasks: 20,
    icon: "mdi-map-marker",
  },
]);
</script>

<style scoped></style>
