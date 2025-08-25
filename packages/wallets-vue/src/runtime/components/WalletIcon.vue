<script lang="ts">
import type { Wallet } from "@/types";
import { defineComponent, toRefs } from "vue";

export default defineComponent({
  props: {
    wallet: Object as PropType<Wallet>,
  },
  setup(props) {
    return toRefs(props);
  },
});
</script>

<template>
  <i class="swv-button-icon">
    <img v-if="wallet" :src="wallet.icon" :alt="`${wallet.name} icon`" />
  </i>
</template>
