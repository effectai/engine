<template>
  <section
    class="section container box"
  >
      <div class="columns is-6">
          <div class="column is-5">
              <img class="box p-0 image is-4by3" src="../public/img/hero-background.png" style="">
          </div>
          <div class="column is-half is-three-fifths-desktop">
              <p class="has-text-weight-medium is-size-2 has-text-left pb-5 has-text-centered-mobile">
                <slot name="header"></slot>
              </p>
              <p class="has-text-weight-normal is-size-5 has-text-left has-text-centered-mobile">
                  <slot name="content"></slot>
              </p> 
          </div>
      </div>

  </section>
</template>

<script setup lang="ts">

</script>

<style lang="scss">

</style>