<template>
  <div id="main" ref="main">
    <slot></slot>
  </div>
</template>

<script setup>
  useHead({
    htmlAttrs: {
      "data-theme": "light",
    },
  });
</script>

<style lang="scss" scoped></style>
