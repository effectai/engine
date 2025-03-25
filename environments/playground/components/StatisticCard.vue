<template>
  <div class="bg-zinc-800 p-4 rounded-lg">
    <div class="flex items-center gap-2 text-zinc-400 mb-2">
      <UIcon :name="props.icon" size="16" />
      <span>{{ props.label }}</span>
    </div>
    <div class="text-2xl font-bold text-white">{{ props.value }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
	icon: string;
	label: string;
	value: string;
}>();
</script>

<style scoped></style>
