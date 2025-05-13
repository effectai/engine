<template>
  <div class="">
    <section class="is-size-3 has-text-centered my-5">
      <h3>{{ title }}</h3>
    </section>
    <div class="columns is-size-2 is-justify-content-center has-text-centered">
      <div class="mx-2">
        00
        <div class="is-size-5">days</div>
      </div>
      <span v-if="!isMobile" class="addHeight mx-3">:</span>
      <!-- Conditional rendering for larger screens -->
      <div class="mx-2">
        00
        <div class="is-size-5">hours</div>
      </div>
      <span v-if="!isMobile" class="addHeight mx-3">:</span>
      <!-- Conditional rendering for larger screens -->
      <div class="mx-2">
        00
        <div class="is-size-5">minutes</div>
      </div>
      <span v-if="!isMobile" class="addHeight mx-3">:</span>
      <!-- Conditional rendering for larger screens -->
      <div class="mx-2">
        00
        <div class="is-size-5">seconds</div>
      </div>
    </div>
    <div>
      <div class="has-text-centered is-size-4 mt-6">
        If you owned EFX tokens on 1-1-2025 12:00 UTC, you can claim your EFFECT
        tokens once the claiming portal becomes available. Stay tuned.
      </div>

      <div
        class="mt-6 is-flex is-justify-content-center is-size-3 is-align-items-center is-primary has-text-primary is-in-front"
      >
        <div class="columns is-mobile is-vcentered is-multiline">
          <div class="column">
            <div class="">
              <nuxt-link
                class="mx-2 is-flex is-justify-content-center"
                to="./news/solana-announcement"
                exact-active-class="is-active"
              >
                <button
                  class="button is-black is-rounded is-flex is-medium"
                  style="gap: 10px"
                >
                  Learn More
                </button>
              </nuxt-link>
            </div>
          </div>
          <div class="column"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: ["title"],
    data: () => ({
      target: new Date("2025-01-01T12:00:00Z"),
      showDays: 0,
      showHours: 0,
      showMinutes: 0,
      showSeconds: 0,
      timer: null,
      loaded: false,
      expired: false,
      isMobile: false,
    }),
    computed: {},
    mounted() {
      window.addEventListener("resize", this.checkMobile);
    },
    beforeDestroy() {
      window.removeEventListener("resize", this.checkMobile); // Clean up
    },
    methods: {},
  };
</script>

<style lang="scss" scoped>
  .addHeight {
    line-height: 1.3;
  }
</style>
