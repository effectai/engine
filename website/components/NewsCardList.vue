<template>
    <div class="" id="latest">
      <div class="columns is-multiline is-flex is-flex-direction-column">
        <NewsCard
          class="new-card"
          v-for="news in paginatedNews"
          :key="news.id"
          :news="news"
          data-aos="fade-up"
          :data-aos-delay="300 + paginatedNews * 250"
        />
      </div>
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @pageChanged="handlePageChange"
        />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'

  interface News {
    id: number
    title: string
    subtitle: string
  }

  const props = defineProps<{
    items: News[]
  }>()

  const currentPage = ref(1)
  const perPage = 3

  const totalPages = computed(() => Math.ceil(props.items.length / perPage))

  const paginatedNews = computed(() => {
    const start = (currentPage.value - 1) * perPage
    return props.items.slice(start, start + perPage)
  })

  function handlePageChange(page: number) {
    currentPage.value = page
  }
</script>
  
  <style lang="scss" scoped>
  .news-card {
    transition: transform 0.3s ease-in-out!important;
    cursor: pointer;
    padding-bottom:20px;
  }
  </style>