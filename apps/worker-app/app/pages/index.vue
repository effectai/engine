<template>
  <div class="">
    <OnboardModal />
    <AlphaSignupBanner />
    <NodeHeroCard />

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 items-stretch"
    >
      <NodeInfoCard />
      <CapabilitiesList />
    </div>

    <UCard class="mb-4 p-0" :ui="{ body: 'p-1 sm:p-0' }" variant="outline">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-server-stack" />
          <h2 class="text-lg font-semibold">Capability Marketplace</h2>
        </div>
      </template>
      <div class="flex items-stretch flex-wrap p-4 gap-2">
        <div
          v-if="userAvailableCapabilities.length === 0"
          class="p-8 text-center text-gray-500 dark:text-gray-400 w-full"
        >
          <div
            class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <UIcon
              name="i-heroicons-sparkles-20-solid"
              class="h-6 w-6 center"
            />
          </div>
          <p class="italic">
            No additional capabilities available at the moment.
          </p>
        </div>

        <CapabilitiesListItem
          v-for="item in userAvailableCapabilities"
          :key="item.id"
          :name="item.name"
          :href="item.href"
          :cost="0"
          :icon="item.icon"
          :category="item.category"
          :description="item.description"
          :tags="item.tags"
        />
      </div>

      <div class="text-center mt-4"></div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { userAvailableCapabilities } = useCapabilities();

definePageMeta({
  middleware: ["auth"],
});
</script>

<style scoped>
  #dashboard {
    background: black !important;
  }
</style>
