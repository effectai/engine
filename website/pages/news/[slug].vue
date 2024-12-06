<template>
  <main id="nuxt-news" style="margin-top: -75px;">
    <ContentRenderer v-if="data" :value="data">
      <div id="blog-header" class="" style="padding-top: 7rem;">
        <div id="whiteout">&nbsp;</div>
        <div class="container blog-outer-padding">
          <div class="columns is-vcentered is-6">
            <div class="column">
              <div class="">
                <h1 class="has-text-black title is-size-2-desktop is-size-2 has-text-weight-normal is-auto-phrase">
                  {{ data.title }}
                </h1>
                <div class="is-flex is-align-items-center">
                  <!-- <SocialBar
                      class="has-text-primary is-size-3"
                      :socials="[twitter, telegram, discord]"
                    /> -->
                </div>
                <span class="is-size-6 mt-5 is-block has-text-weight-light has-text-darkgrey">
                  Posted on {{ data.created }}
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
            <ContentRendererMarkdown :value="data" class="blog-outer-padding" />
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
  background-image: url('./../img/blog-header.png');
  background-size: cover;
  background-position: right 0 bottom 60%;


  @include mixins.from(1200px) {
    padding: 0rem 3rem;
  }
}

#whiteout:after {
    position: absolute;
    content: '';
    display: block;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.6);
}

.blog-outer-padding {
  padding: 3rem 2rem;
  @include mixins.from(1200px) {
    padding: 5rem 2rem;
  }
}

.blog-outer-padding > h2 {
  padding: 2rem 0rem;

  @include mixins.from(1200px) {
    text-align: justify;
    max-width: 65%;
  }
}
.blog-outer-padding > p {
  padding: 0rem 0rem;
  @include mixins.from(1200px) {
    padding: 0rem 7rem;
  }
}


#nuxt-news {
  p {
    line-height: 32px;
    font-weight: 300;
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
  h2 { a { font-weight: 400; } }
}
</style>