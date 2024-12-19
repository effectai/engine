<template>
    <div v-if="loaded">
        <section class="is-size-3 has-text-centered">
            <h3>{{ title }}</h3>
        </section>
        <div class="columns is-size-1 is-justify-content-center has-text-centered">
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
            <div class="is-flex is-justify-content-center mt-6">
                <nuxt-link 
                    v-if="!expired"
                    class="mx-2" 
                    to="https://pancakeswap.finance/?inputCurrency=BNB&outputCurrency=0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0" 
                    target="_blank"
                    exact-active-class="is-active"
                >
                    <button class="button is-black is-rounded is-outlined is-flex is-medium"
                        style="gap:10px">Buy EFX (PancakeSwap)
                    </button>
                </nuxt-link>
                <nuxt-link 
                    v-if="!expired"
                    class="mx-2" 
                    to="./news/solana-announcement" 
                    exact-active-class="is-active"
                >
                    <button class="button is-black is-rounded is-outlined is-flex is-medium"
                        style="gap:10px">Learn More
                        <span class="icon">
                            <i class="fas fa-arrow-right"></i>
                        </span>
                    </button>
                </nuxt-link>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ["title", "year", "month", "day", "hour", "minute", "second"],
    data: () => ({
        showDays: 0,
        showHours: 0,
        showMinutes: 0,
        showSeconds: 0,
        timer: null,
        loaded: false,
        expired: false,
        isMobile: false,  // Track if the screen is mobile
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
        end() {
            return new Date(
                this.year,
                this.month,
                this.day,
                this.hour,
                this.minute,
                this.second
            );
        }
    },
    mounted() {
        this.startTimer();
        this.checkMobile();  // Check if it's mobile
        window.addEventListener('resize', this.checkMobile);  // Recheck on resize
    },
    beforeDestroy() {
        clearInterval(this.timer);
        window.removeEventListener('resize', this.checkMobile);  // Clean up
    },
    methods: {
        startTimer() {
            this.timer = setInterval(() => {
                const now = new Date();
                const difference = this.end - now;

                if (difference <= 0) {
                    clearInterval(this.timer);
                    this.timer = null;
                    this.expired = true;
                    return;
                }

                this.showDays = String(Math.floor(difference / this._days)).padStart(2, "0");
                this.showHours = String(Math.floor((difference % this._days) / this._hours)).padStart(2, "0");
                this.showMinutes = String(Math.floor((difference % this._hours) / this._minutes)).padStart(2, "0");
                this.showSeconds = String(Math.floor((difference % this._minutes) / this._seconds)).padStart(2, "0");
                this.loaded = true;
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
