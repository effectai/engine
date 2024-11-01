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
        </a>
      </div>
      <div id="navbar" class="navbar-menu" :class="{ 'is-active': mobileMenu }">
        <div class="navbar-start"></div>

        <div class="is-centered">
          <div @click="mobileMenu = false">
            <nuxt-link class="nav-text navbar-item pr-5 pl-5" to="/developers" exact-active-class="is-active">
              Developers
            </nuxt-link>
          </div>
          <div @click="mobileMenu = false">
            <nuxt-link to="/ecosystem" class="nav-text navbar-item pr-5 pl-5" exact-active-class="is-active">
              Ecosystem
            </nuxt-link>
          </div>
        </div> 
        <div class="navbar-end is-align-items-center">
          <div class="navbar-item" exact-active-class="is-active">
            <div @click="mobileMenu = false">
              <a href="https://app.effect.ai/" target="_blank" class="button is-primary launch-button"
                exact-active-class="is-active">
                Launch App
                <div id="button-arrow"><img src="/img/arrow-vector.svg" alt="arrow vector" /></div>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const mobileMenu = ref(false);
</script>

<style lang="scss">
.navbar{
    background-color: #ffffff60 !important;
    position: relative !important;
    z-index: 1 !important;
  }
nav {
  // .container{
  //   padding: 0px 90px 0px 90px;
  // }
  .nav-text{
    font-family: 'Inter';
    font-size: 18px;
    font-weight: 400;
    line-height: 27px;
    color: black;
  }
  .is-centered{
      align-items: center;
      display: flex;
    }
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

  .launch-button{
    background-color: black;
    color: white;
    border-radius: 2rem;
    height: 2.8em;
    padding-right: 0.5em;
    font-family: Inter;
    font-size: 16px;
    font-weight: 400;
    line-height: 16px;
  }

  #button-arrow{
    width: 2em;
    height: 2em;
    background-color: white;
    border-radius: 50%;
    margin-left: 1.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  // @media screen and (min-width: 1408px) {
  //   .container:not(.is-max-tablet):not(.is-max-desktop) {
  //       max-width: 100vw;
  //   }
  // }
}
</style>