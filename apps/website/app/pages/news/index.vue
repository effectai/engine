<template>
  <div class="font-inter -mt-[76px]">
    <!-- Header -->
    <div
      class="relative px-6 lg:px-section-x py-section-y bg-[url('/img/blog-header.png')] bg-cover bg-[position:right_0%_bottom_20%]"
    >
      <div class="absolute inset-0 bg-white/60"></div>
      <div class="container max-w-7xl mx-auto relative z-10">
        <p class="text-xs uppercase tracking-wider text-gray-500 mb-3">News & Updates</p>
        <h1 class="text-5xl lg:text-7xl font-light leading-tight">Syncing AI and Humanity</h1>
        <p class="text-lg text-gray-600 mt-4 font-light max-w-xl">
          Platform updates, announcements, and stories from the Effect AI ecosystem.
        </p>
      </div>
    </div>

    <section class="px-6 lg:px-section-x py-20 max-w-7xl mx-auto">
      <template v-if="news && news.length">

        <!-- Latest post -->
        <nuxt-link v-if="latest" :to="latest?.path" class="group grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 pb-16 border-b border-gray-200">
          <div class="aspect-video overflow-hidden">
            <img
              :src="latest?.image.src"
              :alt="latest?.title"
              class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition duration-300"
            />
          </div>
          <div class="flex flex-col justify-center">
            <p class="text-xs uppercase tracking-wider text-gray-400 mb-3">Latest</p>
            
            <h2 class="text-3xl md:text-4xl font-medium text-black group-hover:text-black/60 transition duration-200 leading-snug">
              {{ latest?.title }}
            </h2>
            <p class="text-xs text-gray-400 mb-2">{{ latest?.created }}</p>
            <p class="text-gray-500 mt-4 leading-relaxed line-clamp-3">{{ latest?.description }}</p>
            <span class="mt-6 inline-flex items-center gap-1 text-sm font-medium text-black group-hover:gap-3 transition-all duration-200">
              Read more <Icon name="material-symbols:arrow-right-alt-rounded" class="text-lg" />
            </span>
          </div>
        </nuxt-link>

        <!-- Remaining posts -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-300 border border-gray-100">
          <nuxt-link
            v-for="post in paginated"
            :key="post.path"
            :to="post.path"
            class="group flex flex-col bg-white p-6"
          >
            <div class="aspect-[5/3] overflow-hidden">
              <img
                :src="post.image.src"
                :alt="post.title"
                class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition duration-300"
              />
            </div>
            <div class="flex flex-col flex-grow pt-4 border-t border-gray-100 mt-4">
              <p class="text-xs text-gray-400 mb-2">{{ post.created }}</p>
              <h2 class="text-lg font-medium text-black group-hover:text-black/60 transition duration-200 leading-snug">
                {{ post.title }}
              </h2>
              <p class="text-gray-500 mt-2 text-sm leading-relaxed line-clamp-2 flex-grow">{{ post.description }}</p>
              <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-black group-hover:gap-3 transition-all duration-200">
                Read more <Icon name="material-symbols:arrow-right-alt-rounded" class="text-lg" />
              </span>
            </div>
          </nuxt-link>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-16">
          <button
            :disabled="page === 1"
            @click="page--"
            class="px-4 py-2 rounded-full border text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
          <button
            :disabled="page === totalPages"
            @click="page++"
            class="px-4 py-2 rounded-full border text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>

      </template>
      <p v-else class="text-gray-400 text-center py-20">No posts yet.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const PER_PAGE = 6

const { data: news } = await useAsyncData("news-index", async () => {
  const data = await queryCollection("news").where("published", "=", true).all()
  return data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
})

const latest = computed(() => news.value![0])
const rest = computed(() => news.value!.slice(1))

const page = ref(1)
const totalPages = computed(() => Math.ceil(rest.value.length / PER_PAGE))
const paginated = computed(() => rest.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))

useSeoMeta({
  title: "News & Updates — Effect AI",
  description: "Platform updates, announcements, and stories from the Effect AI ecosystem.",
  ogTitle: "News & Updates — Effect AI",
  ogDescription: "Platform updates, announcements, and stories from the Effect AI ecosystem.",
})
</script>
