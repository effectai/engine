<template>
  <nuxt-link
    :class="{ featured: news.featured }"
    :to="`${news._path}`"
    class="grid grid-cols-1 md:grid-cols-12 max-w-7xl mx-auto lg:gap-y-0 lg:space-y-0"
  >
    <div class="col-span-4 flex">
      <div class="justify-center md:flex items-center md:w-[80%]">
        <div class="news-image relative w-full aspect-[5/3]">
          <img
            class="w-full h-full object-cover filter grayscale"
            :src="news.image.src"
            alt="News image"
          />
        </div>
      </div>
    </div>
    <div class="col-span-8 flex flex-col justify-between">
      <div
        class="news-content flex flex-col h-full border-b py-4 border-gray-200 flex-grow"
      >
        <div class="flex justify-between w-full text-primary text-xs mb-1">
          <span>{{ news.created }}</span>
        </div>

        <h2
          class="title text-2xl md:text-3xl lg:text-4xl font-medium text-black mt-4 hover:text-black/50 my-3"
        >
          {{ news.title }}
        </h2>

        <!-- Description grows and scrolls if needed -->
        <p class="text-black mt-2 flex-grow overflow-auto">
          {{ limitText(news.description, 190) }}
        </p>
      </div>
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

<style scoped>
  /* Tailwind handles most styling */
  /* If you want to style .featured differently, you can do it here */
  .featured {
    /* example highlight */
    background-color: rgba(255 215 0 / 0.1);
  }
</style>
