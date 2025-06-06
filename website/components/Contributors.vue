<script setup lang="ts">
interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const props = defineProps({
  repoOwner: {
    type: String,
    required: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  maxContributors: {
    type: Number,
    default: 20,
  },
  featured: {
    type: Array as () => string[],
    default: () => [],
  },
  title: {
    type: String,
    default: "Contributors",
  },
});

const {
  data: contributors,
  pending,
  error,
} = useFetch<GitHubContributor[]>(
  () =>
    `https://api.github.com/repos/${props.repoOwner}/${props.repoName}/contributors?per_page=${props.maxContributors}`,
  {
    server: false,
    lazy: true,
    default: () => [],
    headers: {
      Accept: "application/vnd.github+json",
    },
  },
);

const withFeatured = computed(() => {
  if (!contributors.value) return [];

  const featuredLogins = new Set(props.featured.map((f) => f.toLowerCase()));

  const c = contributors.value.map((contributor) => ({
    ...contributor,
    isFeatured: featuredLogins.has(contributor.login.toLowerCase()),
  }));

  const multipleOf4 = Math.floor((c.length - 5) / 4) * 4;
  return c.slice(0, 5 + multipleOf4);
});

const sortedContributors = computed(() => {
  if (!contributors.value) return [];

  return withFeatured.value.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.contributions - a.contributions;
  });
});
</script>

<template>
  <section class="">
    <div class="container">
      <div v-if="pending" class="has-text-centered">
        <div class="button is-loading is-large is-white"></div>
        <p class="mt-2">Loading contributors...</p>
      </div>

      <div v-else-if="error" class="notification is-danger">
        <button class="delete"></button>
        Failed to load contributors. Please try again later.
      </div>

      <div
        v-else-if="sortedContributors.length === 0"
        class="notification is-warning"
      >
        No matching contributors found.
      </div>

      <div v-else class="grid-container">
        <div
          v-for="(contributor, index) in sortedContributors"
          :key="contributor.id"
          class="grid-item"
          :class="[
            'item-' + index,
            {
              'is-featured': contributor.isFeatured,
            },
          ]"
        >
          <label class="is-size-7">{{ index + 1 }}</label>
          <a
            :href="contributor.html_url"
            target="_blank"
            rel="noopener noreferrer"
            class=""
          >
            <figure class="image">
              <img
                :class="{
                  'is-rounded': contributor.isFeatured,
                }"
                :src="contributor.avatar_url"
                :alt="contributor.login"
                loading="lazy"
              />
            </figure>
            <div v-if="contributor.isFeatured">
              <h3 class="title is-5 mt-3 mb-1 has-text-white">
                {{ contributor.login }}
              </h3>
              <p class="subtitle is-6 has-text-grey has-text-centered">
                {{ contributor.contributions }} contributions
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
  .grid-container {
    padding-right: 25px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto;
  }

  .grid-item {
    aspect-ratio: 1/1;
    border: 1px solid #515053;
    padding: 5px;
    font-size: 30px;
    text-align: center;
    position: relative;

    &:not(.is-featured) {
      img {
        max-width: 100%;
      }
    }

    &.is-featured {
      grid-column: span 2;
      grid-row: span 2;
    }

    grid-column: span 1;
    grid-row: span 1;
    display: flex;

    a {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    label {
      color: #d7d7d7;
      position: absolute;
      left: 40px;
      font-size: 12px;
    }

    figure {
      display: flex;
      justify-content: center;
    }

    img {
      max-width: 50%;
    }
  }

  .item-0 {
    grid-column: 2 / span 2 !important;
    grid-row: span 2 !important;
  }

  .item-2 {
    grid-column: 6 / span 2 !important;
    grid-row: 0 !important;
  }

  .item-7 {
    grid-column: 5;
  }
</style>
