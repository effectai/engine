<template>
    <div id="hero">
      <section class="section">
        <div class="container mt-5">
          <div class="columns is-vcentered">
            <div class="column is-full-mobile is-three-fifths-tablet is-half-widescreen">
              <h1 v-if="title" class="title is-spaced is-auto-phrase is-in-front">
                <span class="has-text-primary is-block is-in-front">
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
  .title{
    // font-family: "Inter" !important;
    font-size: variables.$title-size !important;
    font-weight: variables.$title-weight !important;
    line-height: 87.14px !important;
    color: black !important;
  }

//   .subtitle{
//     // font-family: "Inter";
//     // font-size: 20px !important;
//     // font-weight: 400 !important;
//     // line-height: 30px !important;
//     // color: #666666 !important;
//   }

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