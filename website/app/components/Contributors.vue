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
  { value: "516", label: "Total Worker Nodes" },
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
  <section class="pb-12">
    <div class="">
      <div v-if="pending" class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"
        ></div>
        <p class="mt-2 text-gray-600">Loading contributors...</p>
      </div>

      <div v-else class="flex items-center">
        <div
          v-for="(pair, i) in paired"
          :key="i"
          class=""
          :class="{
            'mt-[-250px]': i === 1,
            'mt-[150px]': i === 2,
            'mt-[-100px]': i === 3,
          }"
        >
          <div
            v-for="(item, index) in pair"
            :key="item.type === 'contributor' ? item.data.id : item.data.label"
            class="relative border-[#515053] border w-[250px] h-[250px] flex items-center"
            :class="{}"
          >
            <a
              v-if="item.type === 'contributor'"
              :href="item.data.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-full"
            >
              <div class="w-full h-full flex items-center justify-center">
                <img
                  :src="item.data.avatar_url"
                  :alt="item.data.login"
                  loading="lazy"
                  class="p-1.5 grayscale brightness-50"
                />
              </div>
              <div class="absolute left-6 bottom-2.5 text-white">
                <h3 class="text-xl mt-3">{{ item.data.login }}</h3>
                <p class="text-sm text-center">
                  {{ item.data.contributions }} contributions
                </p>
              </div>
            </a>
            <div v-else class="w-full text-center">
              <h2 class="text-4xl font-bold text-gray-300">
                {{ item.data.value }}
              </h2>
              <p class="text-xl text-gray-300 font-medium">
                {{ item.data.label }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
