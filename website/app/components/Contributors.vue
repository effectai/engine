<script setup lang="ts">
  import { contributors } from "./../../constants/contributions";
  import { ref, onMounted, onBeforeUnmount } from "vue";

  const stats = [
    { value: 23, label: "Apps in Ecosystem" },
    { value: "2.1M", label: "Tasks Completed" },
    { value: "205", label: "Proposals Passed" },
    { value: "932", label: "Total Commits" },
    { value: "197", label: "Total stars" },
  ];

  const mixedData = computed(() => {
    const result = [];
    const maxLength = Math.min(stats.length, contributors.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < stats.length) {
        result.push({ type: "stat", data: stats[i] });
      }
      if (i < contributors.length) {
        result.push({ type: "contributor", data: contributors[i] });
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

  const staggerRoot = ref<HTMLElement | null>(null);
  const inView = ref(false);

  function globalIndex(pairIndex: number, itemIndex: number) {
    return pairIndex * 2 + itemIndex;
  }

  onMounted(() => {
    const el = staggerRoot.value;
    if (!el || typeof IntersectionObserver === "undefined") {
      inView.value = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          inView.value = true;
          io.disconnect(); // fire once
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
  });
</script>

<template>
  <section class="pb-12">
    <div class="">
      <div
        ref="staggerRoot"
        class="flex items-center"
        :class="{ 'stagger-on': inView }"
      >
        <div
          v-for="(pair, i) in paired"
          :key="i"
          :class="{
            'mt-[-250px]': i === 1,
            'mt-[150px]': i === 2,
            'mt-[-100px]': i === 3,
          }"
        >
          <div
            v-for="(item, index) in pair"
            :key="
              item.type === 'contributor' ? item.data.name : item.data.label
            "
            class="m-1 relative border-[#515053] border w-[250px] h-[250px] flex items-center stagger-item will-change-transform transform-gpu opacity-0"
            :style="{ '--stagger': globalIndex(i, index) }"
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
                  :src="item.data.avatar"
                  :alt="item.data.name"
                  loading="lazy"
                  class="p-1.5 grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition duration-300"
                />
              </div>
              <div class="absolute left-6 bottom-2.5 text-white">
                <h3 class="text-xl mt-3">{{ item.data.name }}</h3>
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

<style scoped>
  @keyframes fadeUpSoft {
    0% {
      opacity: 0;
      transform: translateY(14px) scale(0.98);
      filter: blur(4px);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  .stagger-on .stagger-item {
    animation-name: fadeUpSoft;
    animation-duration: 1000ms;
    animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
    animation-fill-mode: both;
    animation-delay: calc(var(--stagger) * 360ms);
  }

  @media (prefers-reduced-motion: reduce) {
    .stagger-on .stagger-item {
      animation: none !important;
    }
  }
</style>
