<template>
  <div class="flex-1">
    <div
      class="border-slate-100 p-4 transition-colors h-full flex flex-col border-1 rounded-lg hover:shadow-lg hover:border-gray-400"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-2">
          <div
            class="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center"
          >
            <UIcon :name="icon" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-medium text-gray-900 text-sm">{{ name }}</h3>
            <p class="text-xs text-gray-500">{{ category }}</p>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-600 mb-3 line-clamp-2">
        {{ description || "No description available." }}
      </p>
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-gray-900">{{ cost }} EFFECT</span
        ><span class="text-xs text-gray-500"></span>
      </div>
      <div class="space-y-2 mt-auto">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in props.tags"
            class="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded"
            >{{ tag }}</span
          >
        </div>
        <nuxt-link :to="`${href}`">
          <button
            class="w-full mt-4 px-3 py-1.5 bg-black text-white rounded text-xs flex items-center justify-center"
          >
            Register Capability<svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-chevron-right w-3 h-3 ml-1"
            >
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
  name: string;
  value: string;
  category: string;
  href: string;
  description: string;
  cost: string;
  estimatedEarnings: string;
  tags: string[];
  icon: string;
}>();
</script>

<style scoped></style>
