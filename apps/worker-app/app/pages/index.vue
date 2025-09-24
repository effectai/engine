<template>
  <div class="">
    <OnboardModal />
    <NodeHeroCard />

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 items-stretch"
    >
      <PaymentCard class="" />
      <CapabilitiesList class="" />
    </div>

    <UCard class="mb-4 p-0" :ui="{ body: 'p-1 sm:p-0' }" variant="outline">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-server-stack" />
          <h2 class="text-lg font-semibold">Capability Marketplace</h2>
        </div>
      </template>
      <div class="flex items-stretch flex-wrap p-4 gap-2">
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
const { userAvailableCapabilities, clearUserCapabilities } = useCapabilities();

definePageMeta({
  middleware: ["auth"],
});
</script>

<style scoped>
  #dashboard {
    background: black !important;
  }
</style>
