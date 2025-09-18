<template>
  <div>
    <NodeHeroCard />

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 items-stretch"
    >
      <PaymentCard />
      <CapabilitiesList v-coming-soon />
    </div>

    <UCard
      v-coming-soon
      variant="outline"
      class="mb-4 p-0"
      :ui="{ body: 'p-1 sm:p-0' }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-server-stack" />
          <h2 class="text-lg font-semibold">Available Capabilities</h2>
        </div>
      </template>
      <div class="flex items-stretch">
        <CapabilitiesListItem
          v-for="item in availableCapabilities"
          :key="item.id"
          :name="item.name"
          :category="item.category"
          :description="item.description"
          :cost="item.cost"
          :estimated-earnings="item.estimatedEarnings"
          :tags="item.tags"
        />
      </div>

      <div class="text-center mt-4">
        <UButton size="sm" class="font-medium mb-3" color="none">
          Discover More Capabilities
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const isOpenClaimModal = ref(false);

const availableCapabilities = ref([
  {
    id: 1,
    name: "Dutch Language",
    category: "Language",
    description: "Unlocks Dutch translation and content generation tasks",
    cost: 50,
    estimatedEarnings: 800,
    tags: ["Language assessment", "Certification"],
  },
  {
    id: 2,
    name: "English Language",
    category: "Language",
    description: "Fluent English for content generation tasks",
    cost: 50,
    estimatedEarnings: 800,
    tags: ["Language assessment", "Certification"],
  },
  {
    id: 3,
    name: "Llama 3 Inference",
    category: "Computing",
    description: "Supports Llama 3 model inference tasks",
    cost: 100,
    estimatedEarnings: 1200,
    tags: ["High performance", "AI inference", "Llama 3"],
  },
  {
    id: 4,
    name: "Cuda API",
    category: "Computing",
    description: "Enables GPU-accelerated tasks using Cuda API",
    cost: 150,
    estimatedEarnings: 1500,
    tags: ["High performance", "AI inference", "Cuda"],
  },
]);
</script>

<style scoped></style>
