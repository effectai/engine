<template>
  <div class="flex hidden sm:block">
    <div class="text-black text-2xl w-full flex" style="">
      <a
        v-for="social in socials"
        target="_blank"
        :href="social.link"
        class="mr-2 flex items-center hover:text-zinc-500 transition-colors duration-300"
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
