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
      <div class="flex items-center w-full gap-6">
        <!-- Logo -->
        <nuxt-link to="/" class="inline-flex items-center shrink-0">
          <img
            src="/img/effect-logo.svg"
            alt="Effect Network"
            class="h-14 w-auto p-1"
          />
        </nuxt-link>

        <!-- Center nav links -->
        <div class="hidden md:flex items-center gap-6 flex-1 justify-center">
          <nuxt-link
            to="/news"
            class="text-base font-medium text-gray-600 hover:text-black transition"
          >
            News
          </nuxt-link>
          <a
            href="https://docs.effect.ai/"
            target="_blank"
            class="text-base font-medium text-gray-600 hover:text-black transition"
          >
            Docs
          </a>
          <a
            href="https://github.com/effectai"
            target="_blank"
            class="inline-flex items-center gap-1.5 text-base font-medium text-gray-600 hover:text-black transition"
          >
            <Icon name="octicon:mark-github-16" class="text-base" />
            Contribute
          </a>
        </div>

        <!-- Right: Launch App + socials -->
        <div class="flex items-center gap-4 ml-auto shrink-0">
          <a href="https://worker.effect.ai" target="_blank">
            <button
              class="hidden md:block bg-gradient-to-r from-[#000] to-[#333] text-white font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-50 hover:ring-zinc-500 hover:ring-2 cursor-pointer"
            >
              Launch App
            </button>
          </a>
          <SocialBar :socials="socials" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { discord, telegram, twitter } from "~/constants/socials";

const socials = [twitter, telegram, discord];

const isAtTop = ref(true);
const hasScrolled = computed(() => !isAtTop.value);

let ticking = false;

function readScrollY() {
  const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
  isAtTop.value = y <= 0;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    readScrollY();
    ticking = false;
  });
}

onMounted(() => {
  readScrollY();
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
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
