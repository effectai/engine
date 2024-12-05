<template>
    <div>
        <HeroSection id="main-hero" style="min-height: 700px; background-image: url(./img/hero-background.png);">
            <template #title>
                <h1 v-motion-pop-visible-once :delay="150"
                    class="title hero-title has-text-weight-normal is-auto-phrase">
                    Handcrafted Data for Artificial Intelligence.
                </h1>
                <div class="is-flex mb-6 mt-2 is-very-small">
                    <nuxt-link :delay="250" v-motion-pop-visible-once to="https://github.com/effectai" class="">
                        <div class="control">
                            <div class="tags has-addons">
                                <span class="tag is-primary has-text-white is-very-small"> open source</span>
                                <span class="tag is-dark is-very-small">
                                    <i class="fa fa-heart has-text-smoke"></i>
                                </span>
                            </div>
                        </div>
                    </nuxt-link>

                    <nuxt-link v-motion-pop-visible-once :delay="400"
                        to="https://github.com/effectai/effect-network/blob/master/LICENSE" style="font-size: 10px"
                        class="badge mx-2">
                        <div class="control">
                            <div class="tags has-addons">
                                <span class="tag is-primary has-text-white is-very-small">licence</span>
                                <span class="tag is-dark is-very-small"><small style="height: 12px">MIT</small></span>
                            </div>
                        </div>
                    </nuxt-link>
                </div>

            </template>

            <template #subtitle>
                <p v-motion-slide-visible-once-left class="subtitle mb-5">
                    <span class="pr-6">
                        Effect AI is the data network for training next-gen transparent AI
                        models. <br> Join the workforce by collecting and enriching datasets and
                        get paid instantly.
                    </span>
                </p>
            </template>

            <template #footer>
                <div :delay="600" v-motion-slide-visible-once-left
                    class="is-flex is-size-3 is-align-items-center is-primary has-text-primary is-in-front">
                    <div class="columns is-mobile is-vcentered">
                        <div class="column">
                            <div class="">
                                <nuxt-link class="is-flex" to="https://app.effect.ai/" exact-active-class="is-active">
                                    <button class="button is-black is-rounded is-outlined">Launch App</button>
                                </nuxt-link>

                            </div>
                        </div>
                        <div class="column is-full ">
                            <SocialBar class="p-0" :socials="socials"></SocialBar>
                        </div>
                    </div>
                </div>
            </template>
        </HeroSection>
    </div>

    <!-- <SimpleSection :centered="true">
      <template #subtitle>
        <div class="columns">
            <div class="column">
                <p class="is-size-5 has-text-weight-normal has-text-left">Effect Workforce</p>
            </div>
            <div class="column">
                <p class="is-size-3 has-text-left has-text-weight-medium">
                    In this dynamic ecosystem, every action you take fuels the evolution of AI, 
                    driving progress and pushing boundaries. With each dataset you enhance, you're not just earning rewards 
                </p>
                <p class="is-size-3 has-text-left has-text-weight-medium"> — you're shaping the future of technology.</p>
            </div>
        </div>
      </template>
    </SimpleSection> -->

    <!-- <SimpleSection :centered="true">
      <template #subtitle>
        <div class="columns">
            <div class="column m-5 box is-radius-medium" style="background-image: url(./img/hero-background.png);">
                <div>
                    <p class="is-size-2 has-text-weight-medium has-text-left">Complete Tasks</p>
                    <p class="is-size-5 has-text-weight-normal has-text-left">Complete tasks and earn EFX directly to your wallet.</p>
                    <div class="mt-5 has-text-left">
                        <nuxt-link to="https://app.effect.ai/" exact-active-class="is-active">
                            <Button text="Join the Workforce"/>
                        </nuxt-link>
                    </div>
                </div>
            </div>
            <div class="column m-5 box is-radius-medium" style="background-image: url(./img/hero-background.png);">
                <div>
                    <p class="is-size-2 has-text-weight-medium has-text-left has-text-black">Create Tasks</p>
                    <p class="is-size-5 has-text-weight-normal has-text-left">Access a global, on-demand, 24x7 scalable work force.</p>
                    <div class="mt-5 has-text-left">
                        <nuxt-link to="https://app.effect.ai/" exact-active-class="is-active">
                            <Button text="Create a Task"/>
                        </nuxt-link>
                    </div>
                </div>
            </div>
        </div>
      </template>
    </SimpleSection> -->

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
                    Harmonizing AI with Humanity: Empowering Tomorrow's Workforce Together
                </h1>
            </div>
        </div>
    </SimpleSection>

    <SimpleSection class="container">
        <NewsCardList :items="news" />
    </SimpleSection>

    <SimpleSection class="container" :centered="true">
        <template #subtitle>
            <div class="columns">
                <div class="column is-three-quarters is-three-quarters-tablet is-three-quarters-desktop">
                    <h1 class="is-size-2 has-text-weight-medium has-text-primary has-text-left">
                        Explore the Frontier  of AI Excellence within the Effect AI Ecosystem
                    </h1>
                </div>
                <div class="column is-flex is-align-items-center is-justify-content-right">
                    <div>
                    </div>
                </div>
            </div>
        </template>
    </SimpleSection>

    <SimpleSection :centered="true" class="">
        <template #subtitle>
            <div class="columns is-variable is-4">
                <div class="column">
                    <div class="box is-radius-medium is-flex is-justify-content-center">
                        <figure class="image is-96x96">
                            <img src="/img/ask-a-stranger.png" alt="Description of the image">
                        </figure>
                    </div>
                </div>
                <div class="column">
                    <div class="box is-radius-medium is-flex is-justify-content-center">
                        <figure class="image is-96x96 is-flex is-align-items-center">
                            <img src="/img/delos.png" alt="Description of the image">
                        </figure>
                    </div>
                </div>
                <div class="column">
                    <div class="box is-radius-medium is-flex is-justify-content-center">
                        <figure class="image is-96x96">
                            <img src="/img/quick-cat.png" alt="Description of the image">
                        </figure>
                    </div>
                </div>
                <div class="column">
                    <div class="box is-radius-medium is-flex is-justify-content-center">
                        <figure class="image is-96x96">
                            <img src="/img/vibelyze.png" alt="Description of the image">
                        </figure>
                    </div>
                </div>
            </div>
        </template>
    </SimpleSection>

</template>

<style lang="scss" scoped>
#main-hero {
    background-size: cover;
    padding-top: 5rem;
}
</style>

<script setup lang="ts">
import { socials } from '~/constants/socials';

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