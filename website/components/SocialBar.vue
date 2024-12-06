<template>
  <div class="is-flex">
    <div class="has-text-black" style="font-size:1.7rem; align-self:center">
      <a v-for="social in socials" target="_blank" :href="social.link" :class="$attrs.class" class="mr-2">
        <i :class="social.faClass"></i>
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