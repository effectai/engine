<template>
    <div class="has-text-black">
      <a
        v-for="social in socials"
        target="_blank"
        :href="social.link"
        :class="$attrs.class"
        class="mr-2"
      >
          <i :class="social.faClass"></i>
      </a>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { Social } from "@/types/socials";
  
  const props = defineProps({
    socials: {
      type: Array as PropType<Social[]>,
      required: true,
    },
  });
  </script>
  
  <style></style>