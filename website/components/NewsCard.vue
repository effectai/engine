<template>
    <nuxt-link
      :class="{ 'is-featured': news.featured }"
      :to="`${news._path}`"
      class="is-hoverable is-fullheight is-flex columns is-4"
    >
      <div class="column">
        <img
          class="image is-5by3"
          :src="news.image.src"
        ></img>
      </div>
      <div class="column">
        <div
          class="is-flex is-justify-content-space-between has-fullwidth py-2 has-text-primary"
        >
          <span> {{ news.created }}</span>
          <span>News</span>
        </div>
        <div class="title hero-title has-text-black is-4 is-size-2 has-text-weight-normal">
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

<style lang="scss"></style>