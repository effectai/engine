<template>
  <div id="layout-container">
    <div id="layout-bg"></div>
    <UContainer>
      <UModals />
      <slot />
    </UContainer>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
  #layout-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #layout-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("./../assets/img/hero-background.png") no-repeat center
      center fixed;
    background-size: cover;
    z-index: -1;
    filter: blur(2px);
    opacity: 0.9;
  }
</style>
