<template>
  <UCard class="mt-8 max-w-lg mx-auto">
    <div v-if="false" class="text-center">
      <h1 class="title">👋 Welcome to the Effect AI Worker Dashboard!</h1>
      <p class="mt-2">
        Since you're new, the first step is to introduce yourself to the network
        by defining your capabilities.
      </p>

      <UButton class="mt-8" color="neutral">🧠 Scan your capabilities</UButton>

      <p class="mt-4 text-xs italic">
        If you have any questions, feel free to reach out to us on our
        <a href="https://discord.gg/effectai" target="_blank">Discord server</a
        >.
      </p>
    </div>

    <div v-else class="space-y-6 text-sm leading-6">
      <p class="text-center text-lg font-medium">🔍 Scanning Capabilities...</p>
      <USeparator icon="mdi:lightning-bolt" />

      <ul class="list-disc list-inside space-y-2 font-mono">
        <div
          v-motion
          v-for="(item, index) in capabilityItems"
          :key="index"
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: index * 350 } }"
        >
          <li v-if="item.visible">
            {{ item.icon }} <strong>{{ item.label }}:</strong> {{ item.value }}
          </li>
        </div>
      </ul>

      <div v-if="isScanning" class="mt-4">
        <UProgress color="neutral" v-model="value" />
      </div>
      <div v-else class="mt-4">
        <UButton class="mt-4" color="neutral" to="/worker">
          <UIcon name="mdi:check" />
          <span> Go to Dashboard </span>
        </UButton>
      </div>

      <div v-if="error" class="mt-4">
        <p class="text-red-500">❌ {{ error.message }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import {
  useBattery,
  useDevicesList,
  useFps,
  useGeolocation,
  usePreferredLanguages,
} from "@vueuse/core";
import { computed, ref } from "vue";

definePageMeta({
  layout: "worker",
  middleware: ["auth"],
});

const languages = usePreferredLanguages();
const { coords, locatedAt, error } = useGeolocation();
const { charging, level } = useBattery();
const fps = useFps();
const {
  devices,
  videoInputs: cameras,
  audioInputs: microphones,
  audioOutputs: speakers,
} = useDevicesList();

const browserInfo = navigator.userAgent;
const cores = navigator.hardwareConcurrency;
const screenWidth = window.screen.width;
const screenHeight = window.screen.height;

const value = ref(null); // Set actual progress if needed

const isScanning = ref(true);
setTimeout(() => {
  isScanning.value = false;
}, 5000);

const capabilityItems = computed(() => [
  {
    icon: "🖥",
    label: "Browser",
    value: browserInfo,
    visible: !!browserInfo,
  },
  {
    icon: "🧠",
    label: "Cores",
    value: cores,
    visible: !!cores,
  },
  {
    icon: "🌐",
    label: "Languages",
    value: languages.value.join(", "),
    visible: languages.value.length > 0,
  },
  {
    icon: "🎮",
    label: "FPS",
    value: fps.value,
    visible: fps.value > 0,
  },
  {
    icon: "🔋",
    label: "Battery",
    value:
      level.value != null
        ? `${Math.round(level.value * 100)}%${charging.value ? " ⚡ Charging" : ""}`
        : "",
    visible: level.value != null,
  },
  {
    icon: "📍",
    label: "Location",
    value: coords.value
      ? `${coords.value.latitude.toFixed(5)}, ${coords.value.longitude.toFixed(5)} (@ ${locatedAt.value})`
      : "",
    visible: coords.value != null,
  },
  {
    icon: "📸",
    label: "Cameras",
    value: cameras.value.length,
    visible: cameras.value.length > 0,
  },
  {
    icon: "🎤",
    label: "Microphones",
    value: microphones.value.length,
    visible: microphones.value.length > 0,
  },
  {
    icon: "🔊",
    label: "Speakers",
    value: speakers.value.length,
    visible: speakers.value.length > 0,
  },
  {
    icon: "📱",
    label: "Devices",
    value: devices.value.length,
    visible: devices.value.length > 0,
  },
  {
    icon: "🖥",
    label: "Screen",
    value: `${screenWidth}x${screenHeight}`,
    visible: !!screenWidth && !!screenHeight,
  },
]);
</script>

<style scoped>
  .title {
    font-size: 1.5rem;
    font-weight: 600;
  }
</style>
