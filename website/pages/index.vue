<template>
    <div>
        <HeroSection id="main-hero" :style="`margin-top: -75px; background-image: url('./img/hero-background.png')`">
            <template #title>
                <h1 class="title mb-6 is-size-1-tablet is-size-2
                has-text-dark
                has-text-weight-light is-auto-phrase">
                    <span>
                        Unleashing
                    </span>
                    <span>
                        Decentralized
                    </span>
                    <span>
                        Intelligence
                    </span>
                </h1>
            </template>

            <template #subtitle>
                <p class="subtitle mb-5 has-text-dark">
                    <span class="pr-6">
                        Effect AI is a decentralized P2P Network used to turbocharge human-driven AI tasks.
                        Worker nodes, manager nodes, provider nodes—plug in, get tasks done, and thrive in a trustless
                        network.
                    </span>
                </p>
            </template>

            <template #footer>
                <div class="mt-6 is-flex is-size-3 is-align-items-center is-primary has-text-primary is-in-front">
                    <div class="columns is-mobile is-vcentered is-multiline">
                        <div class="column">
                            <div class="">
                                <nuxt-link class="is-flex" to="https://app.effect.ai/" exact-active-class="is-active">
                                    <button class="button is-black is-rounded is-outlined is-flex is-medium"
                                        style="gap:10px">Launch App
                                        <span class="icon">
                                            <i class="fas fa-arrow-right"></i>
                                        </span>
                                    </button>
                                </nuxt-link>
                            </div>
                        </div>
                        <div class="column">
                            <nuxt-link class="is-flex" to="https://dao.effect.network" exact-active-class="is-active">
                                <button class="button is-black is-rounded is-flex is-medium" style="gap:10px">DAO
                                    Governance
                                </button>
                            </nuxt-link>
                        </div>

                    </div>
                </div>
            </template>
        </HeroSection>
    </div>


    <SimpleSection class="has-text-light has-background-dark">
        <div class="container">
            <div class="columns is-mobile is-multiline">
                <div class="column is-full-mobile is-one-third-tablet has-text-left has-text-centered-mobile">
                    <p class="is-size-3 has-text-medium">Be part of the <br> AI future:</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-2 has-text-weight-bold">22</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-medium">Apps in Ecosystem</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-2 has-text-weight-bold">22M</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-medium">Tasks Completed</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-2 has-text-weight-bold">156</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-medium">Proposals created</p>
                </div>
            </div>
        </div>
    </SimpleSection>

    <SimpleSection :centered="true">
        <template #subtitle>
            <div class="container">

                <div class="columns">
                    <div class="column">
                        <p class="is-size-5 has-text-weight-normal has-text-left">Effect Workforce</p>
                    </div>
                    <div class="column quote-text">
                        <p class="is-size-3 has-text-left has-text-weight-medium">
                            Empowering a global human workforce to shape the future of AI, combining blockchain and P2P
                            technology to deliver smarter, inclusive, and impactful AI solutions.
                        </p>
                        <p class="is-size-3 has-text-left has-text-weight-medium"> — you're shaping the future of
                            technology.</p>
                    </div>
                </div>
            </div>
        </template>
    </SimpleSection>


    <SimpleSection :centered="true" class="has-background-dark">
        <template #subtitle>
            <div class="container">

                <div class="columns">
                    <div class="column  is-radius-medium effect-box has-text-light">
                        <div>
                            01
                            <h2 class="is-size-3 has-text-weight-medium has-text-left">Complete Tasks</h2>
                            <p class="is-size-5 has-text-weight-normal has-text-left">Complete tasks and earn EFX
                                directly
                                to your wallet.</p>
                            <div class="mt-5 has-text-left">
                                <button class="button is-white is-rounded is-outlined is-flex is-medium"
                                    style="gap:10px">Coming soon
                                    <span class="icon">
                                        <i class="fas fa-arrow-right"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="column  is-radius-medium effect-box  has-text-light">
                        <div>
                            02
                            <h2 class="is-size-3 has-text-weight-medium has-text-left">Create Tasks</h2>
                            <p class="is-size-5 has-text-weight-normal has-text-left">Access a global, on-demand, 24x7
                                scalable work force.</p>
                            <div class="mt-5 has-text-left">
                                <button class="button is-white is-rounded is-outlined is-flex is-medium"
                                    style="gap:10px">Coming soon
                                    <span class="icon">
                                        <i class="fas fa-arrow-right"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </SimpleSection>

    <SimpleSection>
        <div class="container">
            <div class="columns">
                <div class="column is-one-fifths is-two-fifths-desktop">
                    <div class="columns is-vcentered h-full">
                        <div class="column is-four-fifths">
                            <div class="">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="column is-three-quarters is-three-quarters-tablet is-three-quarters-desktop ">
                    <h1 class="is-size-3 has-text-weight-medium has-text-primary has-text-left">
                        Syncing AI and Humanity: <br /> <span class="has-text-grey">Building the Future Together</span>
                    </h1>
                </div>
            </div>
            <NewsCardList :items="news" class="my-7" />
        </div>
    </SimpleSection>

    <section class="fluid-container has-background-dark">
        <div class="container">
            <div class="columns is-gapless is-multiline">
                <div class="column is-one-third">
                    <p class="is-size-7 has-text-light has-text-weight-medium is-uppercase mb-5">
                        Some of our partners & dapps
                    </p>
                    <div class="is-size-3 has-text-light mb-6">
                        Explore the Frontier of AI Excellence within the Effect AI Ecosystem
                    </div>
                </div>
                <div class="column">
                    <div class="grid-container">
                        <div :key="i" v-for="(dapp, i) in dapps.slice(0, 6)" class="grid-item" :class="`item-${i}`">
                            <label class="is-size-7">{{ i + 1 }}</label>
                            <div class="is-flex-center">
                                <img :src="`/img/ecosystem/${dapp.image_url}`">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { socials } from '~/constants/socials';
import { dapps } from '~/constants/dapps.js';

//fetch news content and sort by created\
const { data: news } = await useAsyncData("news", async () => {
    const data = await queryContent("/news")
        .where({ published: true })
        .limit(3)
        .find();

    //sort on created date
    return data.sort((a, b) => {
        return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
});
</script>

<style lang="scss" scoped>
@use "bulma/sass/utilities/mixins";

.effect-box {
    padding: 2rem;
    h2 {
        margin-bottom: 4rem;
    }
}

#main-hero {
    background-size: cover;
    background-repeat: no-repeat;
}

.grid-container {
    margin-right: calc(60% - 50vw);
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto;
}

.fluid-container {
    width: 100%;
    overflow: hidden;
    padding: 8rem 0 8rem 4rem;

    @include mixins.desktop {
        padding: 6rem 0rem;
    }
}

.effect-box {
    border: 1px solid #515053;
}

.grid-item {
    aspect-ratio: 1/1;
    border: 1px solid #515053;
    padding: 20px;
    font-size: 30px;
    text-align: center;
    position: relative;
    grid-column: span 2;
    grid-row: span 2;
    display: flex;
    justify-content: center;

    label {
        color: #D7D7D7;
        position: absolute;
        left: 40px;
        font-size: 12px;
    }

    img {
        max-width: 60%;
        max-height: 60%;
        object-fit: contain;
    }
}

.item-0 {
    grid-column: 2 / span 2;
    grid-row: span 2;
}

.item-2 {
    grid-column: 6 / span 2;
    grid-row: 0;
}


.quote-text {
    font-family: Inter;
    font-size: 46px;
    font-weight: 500;
    line-height: 64.4px;
    letter-spacing: -0.02em;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;

}
</style>