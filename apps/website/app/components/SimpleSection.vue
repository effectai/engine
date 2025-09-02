<template>
  <section
    :class="{ 'is-mirrored': isMirrored }"
    class="section"
    data-aos="fade-in"
  >
    <div>
      <h3 v-if="title" class="title is-2 is-spaced">
        {{ title }}
      </h3>
      <h4 v-if="subtitle" class="subtitle">
        {{ subtitle }}
      </h4>
      <slot v-else-if="$slots.subtitle" name="subtitle"></slot>
    </div>
    <div class="">
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      centered?: boolean;
      title?: string;
      subtitle?: string;
      isMirrored?: boolean;
    }>(),
    { centered: false }
  );
</script>

<style lang="scss">
  .is-mirrored {
    .columns {
      flex-direction: row-reverse;
    }
  }
</style>
