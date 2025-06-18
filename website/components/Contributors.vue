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

const stats = [
  { value: 23, label: "Apps in Ecosystem" },
  { value: "2.1M", label: "Tasks Completed" },
  { value: "205", label: "Proposals Passed" },
  { value: "932", label: "Total Commits" },
];

const mixedData = computed(() => {
  const result = [];
  const maxLength = Math.min(stats.length, contributors.value.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < stats.length) {
      result.push({ type: "stat", data: stats[i] });
    }
    if (i < contributors.value.length) {
      result.push({ type: "contributor", data: contributors.value[i] });
    }
  }

  return result;
});

const paired = computed(() => {
  const pairs = [];
  for (let i = 0; i < mixedData.value.length; i += 2) {
    let pair = mixedData.value.slice(i, i + 2);
    if ((i / 2) % 2 === 0) {
      pair = pair.reverse();
    }
    pairs.push(pair);
  }
  return pairs;
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

      <div v-else-if="mixedData.length === 0" class="notification is-warning">
        No matching contributors found.
      </div>

      <div v-else class="is-flex flex-container">
        <div v-for="(pair, i) in paired">
          <div v-for="(item, index) in pair" :key="item.id" class="grid-item">
            <!-- <label class="is-size-7">{{ i * 2 + index + 1 }}</label> -->
            <a
              v-if="item.type === 'contributor'"
              :href="item.data.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class=""
            >
              <figure class="image">
                <img
                  :src="item.data.avatar_url"
                  :alt="item.login"
                  loading="lazy"
                />
              </figure>
              <div class="grid-content">
                <h3 class="title is-5 mt-3 has-text-white">
                  {{ item.data.login }}
                </h3>
                <p class="subtitle is-6 has-text-white has-text-centered">
                  {{ item.data.contributions }} contributions
                </p>
              </div>
            </a>
            <a v-else class="w-full">
              <div
                class="is-size-2 is-flex is-flex-direction-column is-justify-content-center is-align-items-center"
              >
                <h2 class="is-size-2 has-text-weight-bold has-text-grey-light">
                  {{ item.data.value }}
                </h2>
                <p class="is-size-5 has-text-grey-light has-text-weight-medium">
                  {{ item.data.label }}
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
  .flex-container {
    margin-left: min(calc(33% + 10px), calc(30% + 50vw));

    justify-content: end;
    align-items: center;
    gap: 4px;

    > div {
      margin: 2px;
    }

    > :nth-child(2) {
      margin-top: -300px;
    }

    > :nth-child(3) {
      margin-top: 150px;
    }

    > :nth-child(4) {
      margin-top: -180px;
    }
  }

  @media screen and (max-width: 768px) {
    .flex-container {
      > :nth-child(2),
      > :nth-child(3),
      > :nth-child(4) {
        margin: 0 !important;
      }
    }
  }

  label {
    position: absolute;
  }

  .grid-item {
    position: relative;
    border: 1px solid #e5e7eb;
    margin: 4px 0px;
    width: 250px;
    height: 250px;

    display: flex;
    align-items: center;

    img {
      padding: 7px;
      filter: grayscale(100%) brightness(50%);
    }
  }

  .grid-content {
    margin-left: 25px;
    position: absolute;
    bottom: 10px;
    color: black;
  }
</style>
