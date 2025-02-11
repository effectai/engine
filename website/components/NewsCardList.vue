<template>
    <div class="" id="latest">
      <div class="columns is-multiline is-flex is-flex-direction-column">
        <div
          class="column is-full-mobile"
          v-for="(item, i) in items"
          data-aos="fade-up"
          :data-aos-delay="300 + i * 250"
        >
          <NewsCard class="news-card is-fullheight" :news="item" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  const props = defineProps<{
    items: News[];
  }>();
  </script>
  
  <style lang="scss" scoped>
  .news-card {
    transition: transform 0.3s ease-in-out;
    cursor: pointer;
    padding-bottom:20px;
  }
  </style>