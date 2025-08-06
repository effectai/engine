<template>
  <nav
    ref="nav"
    :class="{
      'bg-transparent': !hasScrolled,
      'bg-white shadow-md': hasScrolled,
    }"
    class="sticky top-0 z-50 w-full transition-all duration-300 pt-3 pb-2 px-section-x"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="mx-auto max-w-7xl">
      <div class="flex justify-between items-center w-full">
        <!-- Logo -->
        <nuxt-link to="/" class="inline-flex items-center">
          <img
            src="/img/effect-logo.svg"
            alt="Effect Network"
            class="h-14 w-auto p-1"
          />
        </nuxt-link>

        <!-- Social Bar -->
        <SocialBar :socials="socials" class="" />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { discord, telegram, twitter } from "./../constants/socials.ts";
const socials = [twitter, telegram, discord];

const hasScrolled = ref(false);
const handleScroll = () => {
  hasScrolled.value = window.scrollY > 0;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
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
