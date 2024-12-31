<template>
    <div v-if="loaded" class="">
        <section class="is-size-3 has-text-centered my-5">
            <h3>{{ title }}</h3>
        </section>
        <div class="columns is-size-2 is-justify-content-center has-text-centered">
            <div class="mx-2">
                {{ showDays }}
                <div class="is-size-5">days</div>
            </div>
            <span v-if="!isMobile" class="addHeight mx-3">:</span> <!-- Conditional rendering for larger screens -->
            <div class="mx-2">
                {{ showHours }}
                <div class="is-size-5">hours</div>
            </div>
            <span v-if="!isMobile" class="addHeight mx-3">:</span> <!-- Conditional rendering for larger screens -->
            <div class="mx-2">
                {{ showMinutes }}
                <div class="is-size-5">minutes</div>
            </div>
            <span v-if="!isMobile" class="addHeight mx-3">:</span> <!-- Conditional rendering for larger screens -->
            <div class="mx-2">
                {{ showSeconds }}
                <div class="is-size-5">seconds</div>
            </div>
        </div>
        <div>

            <div v-if="expired" class="has-text-centered is-size-4 mt-6">
                If you owned EFX tokens on 1-1-2025 12:00 UTC, you can claim your EFFECT tokens once the claiming portal becomes available. Stay tuned.
            </div>

            <div
                class="mt-6 is-flex is-justify-content-center is-size-3 is-align-items-center is-primary has-text-primary is-in-front">
                <div class="columns is-mobile is-vcentered is-multiline ">
                    <div class="column">
                        <div class="">
                            <nuxt-link v-if="!expired" class="mx-2 is-flex is-justify-content-center" to="./news/solana-announcement"
                                exact-active-class="is-active">
                                <button class="button is-black is-rounded is-flex is-medium" style="gap:10px">Learn More
                                </button>
                            </nuxt-link>
                        </div>
                    </div>
                    <div class="column">
                    </div>
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
    computed: {
        _seconds: () => 1000,
        _minutes() {
            return this._seconds * 60;
        },
        _hours() {
            return this._minutes * 60;
        },
        _days() {
            return this._hours * 24;
        },
    },
    mounted() {
        this.setTimer();
        this.startTimer();
        this.checkMobile();
        window.addEventListener('resize', this.checkMobile);
    },
    beforeDestroy() {
        clearInterval(this.timer);
        window.removeEventListener('resize', this.checkMobile);  // Clean up
    },
    methods: {
        setTimer() {
            const now = new Date();
            const difference = this.target - now;

            if (difference <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.expired = true;

                // Set the countdown to 00:00:00:00
                this.showMinutes = "00";
                this.showHours = "00";
                this.showDays = "00";
                this.showSeconds = "00";

                return;
            }

            this.showDays = String(Math.floor(difference / this._days)).padStart(2, "0");
            this.showHours = String(Math.floor((difference % this._days) / this._hours)).padStart(2, "0");
            this.showMinutes = String(Math.floor((difference % this._hours) / this._minutes)).padStart(2, "0");
            this.showSeconds = String(Math.floor((difference % this._minutes) / this._seconds)).padStart(2, "0");
            this.loaded = true;
        },

        startTimer() {
            this.timer = setInterval(() => {
                this.setTimer();
            }, 1000);
        },

        // Method to check if the screen is mobile
        checkMobile() {
            this.isMobile = window.innerWidth < 770;  // Set isMobile to true for small screens
        },
    },
};
</script>

<style lang="scss" scoped>
.addHeight {
    line-height: 1.3;
}
</style>
