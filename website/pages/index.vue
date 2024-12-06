<template>
    <div>
        <HeroSection id="main-hero" :style="`background-image: url('./img/hero-background.png')`">
            <template #title>
                <h1 class="title hero-title has-text-weight-light is-auto-phrase">
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
                <div class="is-flex mb-6 mt-2 is-very-small">

                </div>
            </template>

            <template #subtitle>
                <p class="subtitle mb-5">
                    <span class="pr-6">
                        Effect AI is a decentralized P2P Network used to turbocharge human-driven AI tasks.
                        Worker nodes, manager nodes, provider nodes—plug in, get tasks done, and thrive in a trustless
                        network.
                    </span>
                </p>
            </template>

            <template #footer>
                <div class="is-flex is-size-3 is-align-items-center is-primary has-text-primary is-in-front">
                    <div class="columns is-mobile is-vcentered ">
                        <div class="column">
                            <div class="">
                                <nuxt-link class="is-flex" to="https://app.effect.ai/" exact-active-class="is-active">
                                    <button class="button is-black is-rounded is-outlined">Launch App</button>
                                </nuxt-link>

                            </div>
                        </div>
                        <div class="column">
                            <SocialBar class="p-0" :socials="socials"></SocialBar>
                        </div>
                    </div>
                </div>
            </template>
        </HeroSection>
    </div>

    <SimpleSection class="has-text-white has-background-black">
        <template #subtitle>
            <div class="columns is-mobile is-multiline">
                <div class="column is-full-mobile is-one-third-tablet has-text-left has-text-centered-mobile">
                    <p class="is-size-2 has-text-weight-normal">Be part of the <br> AI future:</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-1 has-text-weight-bold">22</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-normal">Apps in Ecosystem</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-1 has-text-weight-bold">22M</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-normal">Tasks Completed</p>
                </div>
                <div class="column is-full-mobile has-text-left has-text-centered-mobile">
                    <p class="is-size-1 has-text-weight-bold">156</p>
                    <p class="is-size-5 has-text-grey-light has-text-weight-normal">Proposals created</p>
                </div>
            </div>
        </template>
    </SimpleSection>

    <SimpleSection class="container">
        <div class="columns">
            <div class="column is-three-quarters is-three-quarters-tablet is-three-quarters-desktop">
                <h1 class="is-size-2 has-text-weight-medium has-text-primary has-text-left">
                    Syncing AI and Humanity: Building the Future Together
                </h1>
            </div>
        </div>
    </SimpleSection>

    <SimpleSection class="container">
        <NewsCardList :items="news" />
    </SimpleSection>


    <div class="fluid-container">
        <div class="columns is-gapless is-multiline">
            <div class="column is-one-third">
                <p class="is-size-7 has-text-light has-text-weight-medium is-uppercase mb-5">
                    Some of our partners & dapps
                </p>
                <div class="is-size-1 has-text-light mb-6">
                    Explore the Frontier of AI Excellence within the Effect AI Ecosystem
                </div>
            </div>
            <div class="column">
                <div class="grid-container">
                    <div :key="i" v-for="(dapp, i) in dapps.slice(0, 6)" class="grid-item" :class="`item-${i}`">
                        <label class="is-size-7">{{ i + 1 }}</label>
                        <img :src="`/img/ecosystem/${dapp.image_url}`">
                    </div>
                </div>
            </div>

        </div>
    </div>
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

#main-hero {
    background-size: cover;
    background-repeat: no-repeat;
 
    @include mixins.desktop {
        padding: 6rem 0rem;
    }
}

.grid-container {
    margin-right: -90px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto;
}

.fluid-container {
    width: 100%;
    overflow: hidden;
    background-color: #1C1A1F;
    padding: 8rem 0 8rem 4rem;
}

.grid-item {
    aspect-ratio: 1;
    border: 1px solid #515053;
    padding: 20px;
    font-size: 30px;
    text-align: center;
    position: relative;
    grid-column: span 2;
    grid-row: span 2;
    display: flex;
    justify-content: center;

    label{
        color:#D7D7D7;
        position: absolute;
        left:40px;
        font-size: 12px;
    }

    img {
        width: 50%;
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

.subtitle {
    font-family: Inter;
    font-weight: 400;
    line-height: 28px;
    letter-spacing: -0.02em;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
}
</style>