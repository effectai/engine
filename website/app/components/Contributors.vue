<script setup lang="ts">
import { contributors } from "./../../constants/contributions";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useIntersectionObserver } from "@vueuse/core";

// --- config ---
const ROTATE_MS = 4500;
const SWAP_COUNT = 2;

const FOLD_ANIM_MS = 1200; // per tile
const FOLD_STEP_MS = 360; // per pair stagger
const FOLD_BUFFER_MS = 80; // safety buffer

const OBS_THRESHOLD = 0.2;
const OBS_ROOT_MARGIN = "0px 0px -10% 0px";

const stats = [
  { value: 23, label: "Apps in Ecosystem" },
  { value: "2.1M", label: "Tasks Completed" },
  { value: "205", label: "Proposals Passed" },
  { value: "932", label: "Total Commits" },
];

const ACTIVE_COUNT = Math.min(stats.length, contributors.length);

// utils
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function contribKey(c: any) {
  return c.id ?? c.login ?? c.name;
}

// state
const allContributors = ref(shuffle(contributors));
const activeContributors = ref(allContributors.value.slice(0, ACTIVE_COUNT));
const spareContributors = ref(allContributors.value.slice(ACTIVE_COUNT));

const fadeFlip = ref<boolean[]>(Array(ACTIVE_COUNT).fill(false));

function rotateContributors() {
  if (spareContributors.value.length === 0) {
    spareContributors.value.push(...shuffle([...activeContributors.value]));
  }
  const swaps = Math.min(
    SWAP_COUNT,
    ACTIVE_COUNT,
    spareContributors.value.length,
  );
  const picked = new Set<number>();
  while (picked.size < swaps) picked.add((Math.random() * ACTIVE_COUNT) | 0);

  for (const idx of picked) {
    const incoming = spareContributors.value.shift();
    const outgoing = activeContributors.value[idx];
    activeContributors.value.splice(idx, 1, incoming);
    spareContributors.value.push(outgoing);
    fadeFlip.value[idx] = !fadeFlip.value[idx];
  }
}

const mixedData = computed(() => {
  const out: Array<{
    type: "stat" | "contributor";
    data: any;
    idx?: number;
  }> = [];
  const n = Math.min(stats.length, activeContributors.value.length);
  for (let i = 0; i < n; i++) {
    out.push({ type: "stat", data: stats[i] });
    out.push({
      type: "contributor",
      data: activeContributors.value[i],
      idx: i,
    });
  }
  return out;
});

const paired = computed(() => {
  const items = mixedData.value;
  const pairs: any[] = [];
  for (let i = 0; i < items.length; i += 2) {
    let pair = items.slice(i, i + 2);
    if ((i / 2) % 2 === 0) pair = pair.reverse();
    pairs.push(pair);
  }
  return pairs;
});

// fold intro: keep base fold styles; .pair-intro only adds the animation
const foldIntro = ref(false);

// lifecycle / in-view trigger
const rootEl = ref<HTMLElement | null>(null);
let timer: number | null = null;
let foldTimer: number | null = null;
let io: IntersectionObserver | null = null;
let started = false;

function startRotation() {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timer = window.setInterval(rotateContributors, ROTATE_MS);
  }
}

function startWhenVisible() {
  if (started) return;
  started = true;

  const pairsCount = ACTIVE_COUNT; // one pair per stat+contributor "slot"
  const totalFold =
    FOLD_ANIM_MS + (pairsCount - 1) * FOLD_STEP_MS + FOLD_BUFFER_MS;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!prefersReduced) {
    // run fold intro first
    foldIntro.value = true;
    foldTimer = window.setTimeout(() => {
      foldIntro.value = false;
      startRotation();
    }, totalFold);
  } else {
    foldIntro.value = false;
    startRotation();
  }
}

const { stop } = useIntersectionObserver(
  rootEl,
  ([{ isIntersecting }], observerElement) => {
    if (isIntersecting) {
      startWhenVisible();
      stop(); // cleanup
    }
  },
  {
    threshold: OBS_THRESHOLD,
    rootMargin: OBS_ROOT_MARGIN,
  },
);

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  if (foldTimer) window.clearTimeout(foldTimer);
  io?.disconnect();
});
</script>

<template>
  <section class="pb-12">
    <ClientOnly>
      <div class="flex items-center" ref="rootEl">
        <div
          v-for="(pair, i) in paired"
          :key="'pair-' + i"
          class="pair pair-fold"
          :style="{ '--pair': i }"
          :class="{
            'opacity-0': started === false,
            'pair-intro': foldIntro,
            'md:mt-[-250px]': i === 1,
            'md:mt-[150px]': i === 2,
            'md:mt-[-100px]': i === 3,
          }"
        >
          <div
            v-for="(item, index) in pair"
            :key="
              item.type === 'contributor'
                ? `c-${contribKey(item.data)}`
                : `s-${item.data.label}`
            "
            class="tile m-1 relative border-[#515053] border w-[180px] h-[180px] md:w-[250px] md:h-[250px] flex items-center transform-gpu"
            :class="[
              index === 0 ? 'tile-top' : 'tile-bottom',
              item.type === 'contributor'
                ? fadeFlip[item.idx!]
                  ? 'fade-in-a'
                  : 'fade-in-b'
                : '',
            ]"
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
                  :key="`img-${contribKey(item.data)}`"
                  :src="item.data.avatar"
                  :alt="item.data.name"
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
    </ClientOnly>
  </section>
</template>

<style scoped>
  .pair {
    perspective: 900px;
    perspective-origin: 50% 50%;
  }

  .tile {
    backface-visibility: hidden;
    transform-style: preserve-3d;
    will-change: transform, opacity;
  }

  @keyframes foldTopIn {
    0% {
      opacity: 0;
      transform: rotateX(-90deg) translateZ(0.001px);
      filter: blur(3px);
    }
    100% {
      opacity: 1;
      transform: rotateX(0deg) translateZ(0);
      filter: blur(0);
    }
  }
  @keyframes foldBottomIn {
    0% {
      opacity: 0;
      transform: rotateX(90deg) translateZ(0.001px);
      filter: blur(3px);
    }
    100% {
      opacity: 1;
      transform: rotateX(0deg) translateZ(0);
      filter: blur(0);
    }
  }

  .pair-fold.pair-intro .tile-top {
    transform-origin: top center;
    animation: foldTopIn 1200ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: calc(var(--pair) * 360ms);
  }
  .pair-fold.pair-intro .tile-bottom {
    transform-origin: bottom center;
    animation: foldBottomIn 1200ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: calc(var(--pair) * 360ms);
  }

  @keyframes kFadeInA {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.99);
      filter: blur(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }
  @keyframes kFadeInB {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.99);
      filter: blur(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }
  .fade-in-a {
    animation: kFadeInA 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .fade-in-b {
    animation: kFadeInB 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .pair-fold.pair-intro .tile-top,
    .pair-fold.pair-intro .tile-bottom,
    .fade-in-a,
    .fade-in-b {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
</style>
