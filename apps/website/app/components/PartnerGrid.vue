<template>
  <div>
    <div class="grid-container">
      <div
        v-for="(dapp, i) in dapps.slice(0, 6)"
        :key="i"
        :class="`grid-item item-${i}`"
      >
        <label>{{ i + 1 }}</label>
        <img :src="`/img/ecosystem/${dapp.image_url}`" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dapps } from "~/constants/dapps";
</script>

<style scoped>
  .grid-container {
    margin-right: calc(50% - 50vw);
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto;
  }

  .grid-item {
    aspect-ratio: 1 / 1;
    border: 1px solid #515053;
    padding: 20px;
    font-size: 30px;
    text-align: center;
    position: relative;
    grid-column: span 2;
    grid-row: span 2;
    display: flex;
    justify-content: center;
    align-items: center; /* center vertically too */
    flex-direction: column;
  }

  .grid-item label {
    color: #d7d7d7;
    position: absolute;
    left: 40px;
    font-size: 12px;
    top: 8px; /* slightly from top */
  }

  .grid-item img {
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
  }

  /* Specific placement */
  .item-0 {
    grid-column: 2 / span 2;
    grid-row: span 2;
  }

  .item-2 {
    grid-column: 6 / span 2;
    /* grid-row: 0; <- 0 is invalid, omit or set specific row */
    grid-row: span 2;
  }
</style>
