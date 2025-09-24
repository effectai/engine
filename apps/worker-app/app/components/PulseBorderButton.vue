<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    default: "Click me",
  },
});

const emits = defineEmits(["click"]);
</script>

<template>
  <button @click="emits('click')" class="animated-button">{{ label }}</button>
</template>

<style scoped lang="scss">
  .animated-button {
    padding: 8px 12px;
    display: grid;
    place-content: center;
    color: white;
    text-shadow: 0 1px 0 #000;

    --border-angle: 0turn;
    --main-bg: conic-gradient(
      from var(--border-angle),
      #213 0%,
      #112 5%,
      #112 60%,
      #213 95%
    );

    border: solid 3px transparent;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    --gradient-border: conic-gradient(
      from var(--border-angle),
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.8) 25%,
      rgba(200, 200, 200, 0.9) 50%,
      rgba(100, 100, 100, 0.7) 75%,
      rgba(255, 255, 255, 0.1) 100%
    );

    background:
      var(--main-bg) padding-box,
      var(--gradient-border) border-box,
      var(--main-bg) border-box;

    background-position: center center;

    animation: bg-spin 3s linear infinite;
    @keyframes bg-spin {
      to {
        --border-angle: 1turn;
      }
    }

    &:hover {
      cursor: pointer;
    }
  }

  @property --border-angle {
    syntax: "<angle>";
    inherits: true;
    initial-value: 0turn;
  }
</style>
