<template>
  <nuxt-link :class="{ 'is-featured': news.featured }" :to="`${news._path}`" class="columns is-multiline">
    <div class="column is-two-fifths">
      <div class="columns is-vcentered h-full">
        <div class="column is-four-fifths h-full">
          <div class="news-image image is-5by3">
            <img :src="news.image.src"></img>
          </div>
        </div>
      </div>

    </div>
    <div class="news-content column is-full is-three-fifths">
      <div class="is-flex is-justify-content-space-between has-fullwidth py-2 has-text-primary">
        <span> {{ news.created }}</span>
        <span>News</span>
      </div>
      <div class="title hero-title is-4 is-size-3 has-text-weight-medium has-text-black">
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

<style lang="scss" scoped>
.news-content {
  padding-bottom:20px;
  border-bottom: 1px solid #f0f0f0;
}

.title:hover {
  color: rgba(0,0,0,0.5) !important;
}

.news-image {
  img {
    object-fit: cover;
  }
}
</style>