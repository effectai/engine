<template>
  <main id="nuxt-news">
    <ContentRenderer v-if="data" :value="data">
      <div id="blog-header" class="">
        <div class="container blog-padding">
          <div class="columns is-vcentered is-6">
            <div class="column">
              <div class="">
                <h1 class="title is-size-1-desktop is-size-2 has-text-weight-normal is-auto-phrase">
                  {{ data.title }}
                </h1>
                <div class="is-flex is-align-items-center">
                  <!-- <SocialBar
                      class="has-text-primary is-size-3"
                      :socials="[twitter, telegram, discord]"
                    /> -->
                </div>
                <span class="is-size-5 mt-5 is-block has-text-black">
                  Posted on {{ data.created }} by {{ data.author }}
                </span>
              </div>
            </div>
            <!-- <div class="column p-0">
                <NuxtPicture
                  :src="data.image.src"
                  class="image is-5by3 has-rounded-corners"
                ></NuxtPicture>
              </div> -->
          </div>
        </div>
      </div>
      <div class="container">
        <div class="columns is-gapless">
          <div class="column content is-medium" id="content">
            <ContentRendererMarkdown :value="data" class="blog-padding" />
          </div>
        </div>
      </div>
    </ContentRenderer>
  </main>
</template>

<script setup lang="ts">

const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useAsyncData(slug, () =>
  queryContent<News>(`/news/${slug}`).findOne()
);

useSeoMeta({
  title: data.value?.title,
  description: data.value?.description,
  ogImage: data.value?.image.src,
});
</script>

<style lang="scss">
@use "bulma/sass/utilities/mixins";

#blog-header {
  background: url('./../img/blog-header.png');
  background-size: cover;

  @include mixins.from(1200px) {
    padding: 6rem 3rem;
  }
}

.blog-padding {
  padding: 3rem 1rem;
  @include mixins.from(1200px) {
    padding: 5rem 7rem;
  }
}

#nuxt-news {
  p {
    line-height: 32px;
  }

  #content {
    img {
      display: flex;
      margin: 80px auto;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    a {
      font-weight: 600;
      color: black;
    }
  }
}
</style>