<template>
  <div>
    <WorkerNodeHeroCard />
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      <WorkerCapabilitiesList v-coming-soon />
      <UCard
        variant="mono"
        class="mb-4 p-0 max-h-[400px] overflow-y-scroll rounded-xlll text-black dark:text-white relative"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <UIcon name="mdi:payment" />
              <h2 class="text-lg font-semibold">Payments</h2>
            </div>
            <div class="flex flex-end justify-end">
              <UButton icon="mdi-export" class="" color="neutral"
                >Export</UButton
              >
            </div>
          </div>
        </template>
        <div class="">
          <WorkerPaymentsListItem
            v-for="payment in payments"
            :key="payment.id"
            :label="payment.label"
            :id="payment.id"
            :amount="payment.amount"
            :status="payment.status"
            :created-at="payment.created_at"
          />
        </div>
      </UCard>
    </div>

    <UCard
      v-coming-soon
      variant="mono"
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
        <WorkerCapabilitiesListItem
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
  layout: "worker",
  middleware: ["auth"],
});

const totalUptime = ref("12h 34m");
const totalEarned = ref("$1,234.56");
const totalCompletedTasks = ref(42);
const performanceScore = ref("95%");

const managers = ref([
  {
    id: 1,
    url: "https://manager1.example.com",
    region: "us-west",
    announcedAddresses: ["https://manager1.example.com/ipfs/QmExampleAddress1"],
    version: "1.0.0",
    peerId: "QmExamplePeerId1",
  },
  {
    id: 2,
    url: "https://manager2.example.com",
    region: "us-east",
    announcedAddresses: ["https://manager2.example.com/ipfs/QmExampleAddress2"],
    version: "1.0.0",
    peerId: "wasd12aafb33asa32",
  },
  {
    id: 3,
    url: "https://manager3.example.com",
    region: "eu-central",
    announcedAddresses: ["https://manager3.example.com/ipfs/QmExampleAddress3"],
    version: "1.0.0",
    peerId: "peer3",
  },
]);

const payments = ref([
  {
    id: 1,
    amount: 100,
    status: "Completed",
    created_at: "2023-10-01",
    label: "payment for task 553",
  },
  {
    id: 2,
    amount: 200,
    status: "Pending",
    created_at: "2023-10-02",
    label: "payment for task 779",
  },
  {
    id: 3,
    amount: 150,
    status: "Failed",
    created_at: "2023-10-03",
    label: "payment for task 332",
  },
]);

const capabilites = ref([
  { name: "Battery Level", value: "85%" },
  { name: "Charging", value: "Yes" },
  { name: "Geolocation", value: "Enabled" },
  { name: "FPS", value: "60" },
  { name: "Languages", value: "English, Spanish" },
]);

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
