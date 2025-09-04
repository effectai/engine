<template>
  <div id="hero">
    <section class="section">
      <div class="container mt-5">
        <div class="columns is-vcentered">
          <div
            class="column is-full-mobile is-four-fifths-tablet is-four-fifths-widescreen is-three-quarters-desktop"
          >
            <h1 v-if="title" class="title is-spaced is-auto-phrase">
              <span class="has-text-primary is-block">
                {{ title }}
              </span>
            </h1>

            <div
              id="hero-title"
              v-else-if="$slots.title"
              class="is-spaced keep-all"
            >
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

  #hero-title {
    font-size: 96px;
    font-weight: 300;
    line-height: 96px;
  }

  .subtitle {
    font-size: 20px;
    font-weight: 400;
    line-height: 28px;
    letter-spacing: -0.02em;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
  }

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
