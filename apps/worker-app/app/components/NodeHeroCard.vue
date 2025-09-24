<template>
  <div>
    <div
      class="rounded-xl p-4 sm:p-6 md:p-8 mb-6 text-white relative overflow-hidden bg-black/50 text-black! bg-[url('/img/hero-background.png')] bg-cover bg-center border-white/20"
    >
      <!-- Decorative circles -->
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div
          class="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-white rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"
        ></div>
      </div>

      <!-- Main Grid -->
      <div class="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Profile/Stats (Left column) -->
        <div class="md:col-span-5 space-y-4">
          <div class="flex items-center space-x-3 mb-2">
            <div
              class="w-12 h-12 bg-white/50 rounded-lg flex items-center justify-center backdrop-blur-sm"
            >
              <img
                :src="profileImage"
                alt="Profile Picture"
                class="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <h2 class="text-xl sm:text-2xl font-bold">{{ username }}</h2>
              <p class="text-gray-800 text-sm">Worker Node ({{ language }})</p>
            </div>
          </div>

          <!-- Peer ID -->
          <div
            class="flex items-center justify-between p-3 bg-white/50 rounded-lg backdrop-blur-sm"
          >
            <span class="text-gray-800 text-sm">Peer ID</span>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-sm" v-if="peerId">
                {{ sliceBoth(peerId.toString()) }}
              </span>
              <button
                @click="copy(peerId.toString())"
                class="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <!-- Copy icon -->
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="8" y="8" width="14" height="14" rx="2" ry="2" />
                  <path
                    d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <p class="text-gray-800 text-xs">Tasks Completed</p>
              <p class="text-lg font-bold">{{ totalTasksCompleted }}</p>
            </div>
            <div class="p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <p class="text-gray-800 text-xs">Tasks Rejected</p>
              <p class="text-lg font-bold">{{ tasksRejected }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <p class="text-gray-800 text-xs">Reputation</p>
              <div class="flex items-center space-x-1">
                <svg
                  class="w-4 h-4 text-yellow-400 fill-current"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
                <span class="text-lg font-bold">5</span>
              </div>
            </div>
            <div class="p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <p class="text-gray-800 text-xs">Performance Score</p>
              <p class="text-lg font-bold">{{ performanceScore }}%</p>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <ManagerConnectionModal class="flex-0 min-w-[180px]" />
            <IdentityDocument :peerId="peerId" />
          </div>
        </div>

        <!-- Progress and summary (Right column) -->
        <div class="md:col-span-4 space-y-4 md:col-start-9 mt-5">
          <div class="md:col-span-3 flex justify-center items-center">
            <div class="relative">
              <svg
                class="w-24 h-24 sm:w-32 sm:h-32 -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#E2FF03"
                  stroke-width="6"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashoffset"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl sm:text-3xl font-bold">{{ level }}</div>
                  <div class="text-xs text-gray-800">LEVEL</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-800">Experience Progress</span>
              <span class="font-mono"
                >{{ experience }} / {{ experiencePerLevel[level] }}</span
              >
            </div>
            <div class="w-full bg-white/50 rounded-full h-2 mt-1">
              <div
                class="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                :style="`width: ${progress}%`"
              ></div>
            </div>
          </div>

          <!-- Mini stats -->
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="p-2 bg-white/50 rounded-lg backdrop-blur-sm text-xs">
              Node age: {{ daysInNetwork }} days
            </div>
            <div class="p-2 bg-white/50 rounded-lg backdrop-blur-sm text-xs">
              Capabilities: {{ userCapabilityCount }}
            </div>
          </div>

          <!-- Total earnings -->
          <div class="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
            <div class="flex items-center justify-center gap-4">
              <img
                src="@/assets/img/effect-coin.jpg"
                class="w-10 rounded-full"
              />
              <div>
                <p class="text-xl font-bold">
                  {{ totalEffectEarnings }} EFFECT
                </p>
                <p class="text-xs text-gray-800">Total Earnings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  peerId,
  useWorkerLevel,
  totalTasksCompleted,
  totalEffectEarnings,
  tasksRejected,
  daysInNetwork,
  performanceScore,
} = useWorkerNode();

const { userCapabilityCount } = useCapabilities();

import { useClipboard, useNavigatorLanguage } from "@vueuse/core";

const { level, progress, experience, experiencePerLevel } = useWorkerLevel();
const { language } = useNavigatorLanguage();

const radius = computed(() => 45);
const circumference = computed(() => 2 * Math.PI * radius.value);
const normalizedPercentage = computed(() =>
  Math.min(Math.max(progress.value, 0), 100),
);
const dashoffset = computed(
  () => circumference.value * (1 - normalizedPercentage.value / 100),
);

const { userInfo } = useAuth();
const username = computed(() => userInfo.value?.username || "Unknown User");
const profileImage = computed(() => {
  return (
    userInfo.value?.profileImage ||
    "https://avatars.dicebear.com/api/identicon/default.svg"
  );
});

const { copy } = useClipboard();
const isOpen = ref(false);
</script>

<style scoped></style>
