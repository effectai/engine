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
        <div class="md:col-span-6 space-y-4 md:col-start-1">
          <div class="md:col-span-3 gap-2 flex justify-between items-center">
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
                <p class="text-gray-800 text-sm">
                  Worker Node ({{ language }})
                </p>
              </div>
            </div>
          </div>

          <!-- Progress bar -->

          <!-- Mini stats -->
          <div class="grid grid-cols-3 gap-4 mt-4">
            <div
              class="p-2 bg-white/50 rounded-lg backdrop-blur-sm text-xs font-mono flex items-center justify-between"
            >
              <label>Tasks completed:</label>
              {{ totalTasksCompleted }}
            </div>

            <div
              class="p-2 bg-white/50 rounded-lg backdrop-blur-sm text-xs font-mono flex items-center justify-between"
            >
              <label>Capabilities:</label>
              {{ userCapabilityCount }}
            </div>

            <div
              class="p-2 bg-white/50 rounded-lg backdrop-blur-sm text-xs font-mono flex items-center justify-between"
            >
              <label>Peformance Score:</label>
              {{ performanceScore }}%
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

          <!-- Actions -->
          <div class="flex space-x-2 items-center mt-2">
            <ManagerConnectionModal class="" />
            <IdentityDocument :peerId="peerId" />
          </div>
        </div>

        <!-- Level and Experience -->
        <div class="md:col-span-6 space-y-4 md:col-start-8 flex flex-col">
          <div class="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto">
            <svg class="sm:w-48 sm:h-48 -rotate-90" viewBox="0 0 100 100">
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
          <div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-800">Experience Progress</span>
              <span class="font-mono"
                >{{ experience }} / {{ currentLevelExpMin }}</span
              >
            </div>
            <div class="w-full bg-white/50 rounded-full h-2 mt-1">
              <div
                class="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                :style="`width: ${progress}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { peerId, totalTasksCompleted, totalEffectEarnings, performanceScore } =
  useWorkerNode();

const { userCapabilityCount } = useCapabilities();

import { useClipboard, useNavigatorLanguage } from "@vueuse/core";

const { level, progress, experience, currentLevelExpMin } = useWorkerLevel();
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
