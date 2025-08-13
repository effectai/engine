<template>
  <div class="-mt-[76px] font-inter">
    <div
      v-if="data"
      class="relative px-6 lg:px-section-x py-section-y bg-[url('../img/blog-header.png')] bg-cover bg-[position:right_0%_bottom_20%]"
    >
      <div class="absolute inset-0 bg-white/60"></div>
      <div class="container max-w-7xl mx-auto relative z-10">
        <h1 class="text-5xl lg:leading-normal lg:text-7xl leading-tight">
          {{ data?.title }}
        </h1>
        <p class="text-lg text-gray-600 mt-4 font-light">
          Posted by {{ data.author }} on {{ data.lastUpdated }}
        </p>
      </div>
    </div>

    <ContentRenderer
      v-if="data"
      :value="data"
      class="mt-10 article prose lg:prose-xl max-w-7xl mx-auto px-6 font-light"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { data } = await useAsyncData(route.path, () => {
  return queryCollection("news").path(route.path).first();
});

useSeoMeta({
  title: data.value?.title,
  description: data.value?.description,
  ogImage: data.value?.image.src,
});
</script>

<style lang="scss">
  .blog-header::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("../img/blog-header.png");
    background-size: cover;
    background-position: right 0% bottom 20%;
    filter: brightness(1.2);
    z-index: 0;
  }
</style>
