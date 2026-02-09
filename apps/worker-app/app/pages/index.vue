<template>
  <div class="">
    <OnboardModal />
    <AlphaSignupBanner />
    <AlphaNoticeBanner />
    <NodeHeroCard />

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 items-stretch"
    >
      <NodeInfoCard />
      <CapabilitiesList />
    </div>

    <UCard class="mb-4 p-0 relative" :ui="{ body: 'p-1 sm:p-0' }" variant="outline">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-server-stack" />
          <h2 class="text-lg font-semibold">Capability Marketplace</h2>
        </div>
      </template>

      <div class="p-4">
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

        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CapabilitiesListItem
              v-for="item in currentPageItems"
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

          <div
            v-if="pageCount > 1"
            class="flex justify-center items-center gap-2 mt-4"
          >
            <button
              @click="prevPage"
              :disabled="currentPage === 0"
              class="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 disabled:opacity-50"
            >
              <UIcon name="i-heroicons-chevron-left-20-solid" />
            </button>

            <span class="text-sm">
              Page {{ currentPage + 1 }} of {{ pageCount }}
            </span>

            <button
              @click="nextPage"
              :disabled="currentPage >= pageCount - 1"
              class="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 disabled:opacity-50"
            >
              <UIcon name="i-heroicons-chevron-right-20-solid" />
            </button>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
const { userAvailableCapabilities } = useCapabilities();

definePageMeta({
  middleware: ["auth"],
});

const cardsPerPage = ref(3);
const currentPage = ref(0);

function updateCardsPerPage() {
  const w = window.innerWidth;
  if (w < 640) {
    cardsPerPage.value = 1;
  } else if (w < 1024) {
    cardsPerPage.value = 2;
  } else {
    cardsPerPage.value = 3;
  }
  // reset page if it exceeds max after resize
  if (currentPage.value > pageCount.value - 1) {
    currentPage.value = pageCount.value - 1;
  }
}

onMounted(() => {
  updateCardsPerPage();
  window.addEventListener("resize", updateCardsPerPage);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateCardsPerPage);
});

const pageCount = computed(() => {
  return Math.ceil(userAvailableCapabilities.value.length / cardsPerPage.value);
});

const currentPageItems = computed(() => {
  const start = currentPage.value * cardsPerPage.value;
  return userAvailableCapabilities.value.slice(
    start,
    start + cardsPerPage.value
  );
});

function nextPage() {
  if (currentPage.value < pageCount.value - 1) currentPage.value++;
}

function prevPage() {
  if (currentPage.value > 0) currentPage.value--;
}
</script>

<style scoped>
#dashboard {
  background: black !important;
}
</style>
