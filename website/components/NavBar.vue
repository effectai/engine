<template>
  <nav class="navbar pt-2 pb-1 is-sticky top-0" role="navigation" aria-label="main navigation">
    <div class="container">
      <div class="is-flex">
        <nuxt-link class="" to="/">
          <img style="height: 3.5rem; width: auto" src="/img/effect-logo.svg" alt="Effect Network" class="logo p-1" />
        </nuxt-link>

        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbar" @click="mobileMenu = !mobileMenu">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div id="navbar" class="navbar-menu" :class="{ 'is-active': mobileMenu }">
        <div class="navbar-start"></div>

        <div class="is-flex is-align-items-center">
          <div @click="mobileMenu = false">
            <nuxt-link class="has-text-black has-text-weight-normal is-size-5 navbar-item pr-5 pl-5" to="/developers" exact-active-class="is-active">
              Developers
            </nuxt-link>
          </div>
          <div @click="mobileMenu = false">
            <nuxt-link to="/ecosystem" class="has-text-black has-text-weight-normal is-size-5 navbar-item pr-5 pl-5" exact-active-class="is-active">
              Ecosystem
            </nuxt-link>
          </div>
        </div> 
        <div class="navbar-end is-align-items-center">
          <div class="navbar-item" exact-active-class="is-active">
            <div @click="mobileMenu = false">
              <nuxt-link to="/ecosystem" exact-active-class="is-active">
                <Button text="Launch App"/>
              </nuxt-link>
            </div>
          </div>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const mobileMenu = ref(false);

function joinNow() {
  // Your function logic, e.g., navigating to another page or triggering an action
  console.log("Launching the app!");
}
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
