<template>
  <nav ref="nav" :class="{ 'nav-transparent': !hasScrolled, 'nav-white': hasScrolled }"
    class="pt-2 pb-1 is-sticky top-0" role="navigation" aria-label="main navigation">
    <div class="container">
      <div class="w-full is-flex is-justify-content-space-between">
        <nuxt-link class="" to="/">
          <img style="height: 3.5rem; width: auto" src="/img/effect-logo.svg" alt="Effect Network" class="logo p-1" />
        </nuxt-link>
          <social-bar :socials="socials" class=""></social-bar>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { discord, telegram, twitter } from '~/constants/socials';
const socials = [twitter, telegram, discord]

const hasScrolled = ref(false);
const handleScroll = () => {
  hasScrolled.value = window.scrollY > 0;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

</script>

<style lang="scss">
nav {
  z-index: 1000;
  transition: background-color 0.5s;

  &.nav-transparent {
    background-color: transparent;
    box-shadow: none;
  }
  &.nav-white {
    background-color: rgba(255, 255, 255, 0.561);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}
</style>
