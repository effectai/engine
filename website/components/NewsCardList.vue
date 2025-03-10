<template>
  <div class="" id="latest">
    <div class="columns is-multiline is-flex is-flex-direction-column">
      <NewsCard class="new-card" v-for="news in paginatedNews" :news="news" />
    </div>
    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @pageChanged="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
	items: News[];
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
