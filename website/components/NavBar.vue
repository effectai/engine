<template>
  <nav class="navbar pt-2 pb-1 is-sticky top-0" role="navigation" aria-label="main navigation">
    <div class="container">
      <div class="w-full is-flex is-justify-content-space-between">
        <nuxt-link class="" to="/">
          <img style="height: 3.5rem; width: auto" src="/img/effect-logo.svg" alt="Effect Network" class="logo p-1" />
        </nuxt-link>
      
        <div class="">
          <social-bar :socials="socials" class="is-size-3"></social-bar>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { discord, telegram, twitter } from '~/constants/socials';

const mobileMenu = ref(false);

const socials = [twitter, telegram, discord]
</script>

<style lang="scss">
nav {

  .navbar-item {
    margin: 0 0.5rem;

    &:after {
      display: block;
      width: 0;
      height: 2px;
      position: absolute;
      transition: width 0.5s;
      bottom: 8px;
      background: black;
      content: "";
    }
  }

  .is-active {
    &:after {
      width: calc(100% - 1.5rem);
    }
  }



}
</style>
