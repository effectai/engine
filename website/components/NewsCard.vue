<template>
  <nuxt-link :class="{ 'is-featured': news.featured }" :to="`${news._path}`" class="is-hoverable columns is-multiline">
    <div class="column is-full is-half-tablet">
      <div class="news-image image is-5by3">
        <img class="" :src="news.image.src"></img>
      </div>
    </div>
    <div class="column is-full is-half-tablet">
      <div class="is-flex is-justify-content-space-between has-fullwidth py-2 has-text-primary">
        <span> {{ news.created }}</span>
        <span>News</span>
      </div>
      <div class="title hero-title is-4 is-size-2 has-text-weight-medium has-text-black">
        {{ news.title }}
      </div>
      <p class="has-text-black">
        {{ limitText(news.description, 190) }}
      </p>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
  news: News;
}>();

const limitText = (text: string, limit: number) => {
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};
</script>

<style lang="scss">
.news-image {
  img {
    object-fit: cover;
  }
}
</style>