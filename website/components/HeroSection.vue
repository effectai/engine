<template>
    <div id="hero">
      <section class="section">
        <div class="container mt-5">
          <div class="columns is-vcentered">
            <div class="column is-full-mobile is-three-fifths-tablet is-three-fifths-widescreen ">
              <h1 v-if="title" class="title is-spaced is-auto-phrase">
                <span class="has-text-primary is-block">
                    {{title}}
                </span>
              </h1>
  
              <div v-else-if="$slots.title" class="is-spaced keep-all">
                <slot name="title"> </slot>
              </div>
  
              <slot class="subtitle is-size-3" name="subtitle"></slot>
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </section>
    </div>
  </template>
  
  <script setup lang="ts">
  const props = defineProps({
    height: {
      type: String,
      default: "700px",
    },
    title: {
      type: String,
    },
  });
  </script>
  
  <style lang="scss">
  @use "@/assets/scss/variables.scss";

  #hero {
    position: relative;
    width: 100%;
    height: 100%;
    .section,
    .container,
    .title {
      font-size: 3rem;
    }
  
  }
  </style>