<template>
  <div>
    <div
      class="rounded-xl p-8 mb-6 text-white relative overflow-hidden bg-gradient-to-br from-zinc-800 to-neutral-500 rounded-xlll text-black dark:text-white relative"
    >
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"
        ></div>
      </div>
      <div class="relative z-10 grid grid-cols-12 gap-8">
        <div class="col-span-5">
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-network w-6 h-6 text-black"
              >
                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                <path d="M12 12V8"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold">{{ username }}</h2>
              <p class="text-gray-300 text-sm">Worker Node • Europe-West</p>
            </div>
          </div>
          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
            >
              <span class="text-gray-300 text-sm">Peer ID</span>
              <div class="flex items-center space-x-2">
                <span class="font-mono text-sm">12D3KooW...9x6PipXh</span
                ><button
                  class="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-copy w-3 h-3"
                  >
                    <rect
                      width="14"
                      height="14"
                      x="8"
                      y="8"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path
                      d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                class="p-3 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <p class="text-gray-300 text-xs">Total Tasks</p>
                <p class="text-xl font-bold">{{ totalTasksCompleted }}</p>
              </div>
              <div
                class="p-3 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <p class="text-gray-300 text-xs">Peformance Score</p>
                <p class="text-xl font-bold">{{ performanceScore }}%</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                class="p-3 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <p class="text-gray-300 text-xs">Reputation</p>
                <div class="flex items-center space-x-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-star w-4 h-4 text-yellow-400 fill-current"
                  >
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    ></polygon></svg
                  ><span class="text-xl font-bold">5</span>
                </div>
              </div>
              <div
                class="p-3 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <p class="text-gray-300 text-xs">Tasks rejected</p>
                <p class="text-xl font-bold">{{ tasksRejected }}</p>
              </div>
            </div>
          </div>
          <div class="mt-6">
            <WorkerManagerConnectionModal v-model="isOpen" />
          </div>
        </div>
        <div class="col-span-3 flex items-center justify-center">
          <div class="relative">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="6"
                fill="none"
              ></circle>
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                stroke-width="6"
                fill="none"
                stroke-linecap="round"
                stroke-dasharray="282.7433388230814"
                stroke-dashoffset="70.68583470577033"
                class="transition-all duration-1000 ease-out"
              ></circle>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-3xl font-bold">{{ level }}</div>
                <div class="text-xs text-gray-300">LEVEL</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-4">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Experience Progress</span
              ><span class="text-sm font-mono"
                >{{ experience }} / {{ experiencePerLevel[level] }}</span
              >
            </div>
            <div class="w-full bg-white/10 bg-opacity-20 rounded-full h-2">
              <div
                class="bg-white/10 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="`width: ${progress}%`"
              ></div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-6">
              <div
                class="text-center p-4 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-award w-6 h-6 mx-auto mb-2 text-yellow-400"
                >
                  <circle cx="12" cy="8" r="6"></circle>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                </svg>
                <p class="text-2xl font-bold">5</p>
                <p class="text-xs text-gray-300">Active Capabilities</p>
              </div>
              <div
                class="text-center p-4 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-trending-up w-6 h-6 mx-auto mb-2 text-green-400"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <p class="text-2xl font-bold">{{ daysInNetwork }} Days</p>
                <p class="text-xs text-gray-300">Network Member</p>
              </div>
            </div>
            <div
              class="text-center p-4 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-dollar-sign w-6 h-6 mx-auto mb-2 text-blue-400"
              >
                <line x1="12" x2="12" y1="2" y2="22"></line>
                <path
                  d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                ></path>
              </svg>
              <p class="text-2xl font-bold">{{ totalEffectEarnings }} EFFECT</p>
              <p class="text-xs text-gray-300">Total Earnings</p>
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

const { level, progress, experience, experiencePerLevel } = useWorkerLevel();

const { username } = useAuth();

const capabilities = computed(() => {
  return peerId.value?.capabilities || [];
});

const isOpen = ref(false);
</script>

<style scoped></style>
