<template>
  <div class="flex">
    <div class="text-black" style="">
      <a
        v-for="social in socials"
        target="_blank"
        :href="social.link"
        class="mr-2"
      >
        <Icon :name="social.className" />
      </a>
    </div>
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
