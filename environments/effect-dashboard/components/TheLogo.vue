<template>
        <img v-if="color.value === 'light'" class="h-12 mt-2 w-auto" src="@/assets/img/logo-dark.svg" alt="Effect AI Logo" />
        <img v-else class="h-12 mt-2 w-auto" src="@/assets/img/logo-light.svg" alt="Effect AI Logo" />
</template>

<script setup lang="ts">
const color = useColorMode();
</script>

<style scoped>

</style>