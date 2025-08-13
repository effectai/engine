<template>
  <div id="latest" class="">
    <!-- Flex column layout with wrapping -->
    <div class="flex flex-col flex-wrap gap-4">
      <NewsCard
        class="new-card"
        v-for="news in paginatedNews"
        :key="news.id"
        :news="news"
      />
    </div>

    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @pageChanged="handlePageChange"
      class="mt-12"
    />
  </div>
</template>

<script setup lang="ts">
import type { NewsCollectionItem } from "@nuxt/content";
import { ref, computed } from "vue";

const props = defineProps<{
  items: NewsCollectionItem[];
  perPage: number;
}>();

const currentPage = ref(1);

const totalPages = computed(() =>
  Math.ceil(props.items.length / props.perPage),
);

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * props.perPage;
  return props.items.slice(start, start + props.perPage);
});

function handlePageChange(page: number) {
  currentPage.value = page;
}
</script>
