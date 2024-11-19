<template>
    <div>
        <HeroSection class="nav-bar-height" id="main-hero" style="min-height: 700px; background-image: url(./img/hero-background.png);">
            <template #title>
                <!-- <h1 class="title title-weight is-spaced has-text-primary"> -->
                <h1 class="title hero-title has-text-weight-normal is-auto-phrase">
                    Handcrafted Data for Artificial Intelligence.
                </h1>
            </template>
    
            <template #subtitle>
                <p class="subtitle pt-6">
                    <span class="pr-6">
                    Effect AI is the data network for training next-gen transparent AI
                    models. <br> Join the workforce by collecting and enriching datasets and
                    get paid instantly.
                    </span>
                </p>
            </template>
    
            <template #footer>
                <div class="is-flex is-size-3 is-align-items-center is-primary has-text-primary is-in-front">
                    <div>
                        <nuxt-link to="https://app.effect.ai/" exact-active-class="is-active">
                            <Button text="Launch App"/>
                        </nuxt-link>
                    </div>
                </div>
            </template>
        </HeroSection>
    </div>

    <SimpleSection :centered="true" class="">
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
    </SimpleSection>

    <SimpleSection :centered="true">
      <template #subtitle>
        <div class="columns">
            <div class="column m-5 box is-radius-medium" style="background-image: url(./img/hero-background.png);">
                <div>
                    <p class="is-size-2 has-text-weight-medium has-text-left has-text-black">Complete Tasks</p>
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
    </SimpleSection>

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
    <SimpleSection class="">
        <div class="columns">
            <div class="column is-half">
                <h1 class="is-size-2 has-text-weight-medium has-text-primary has-text-left is-half">
                    Harmonizing AI with Humanity: Empowering Tomorrow's Workforce Together
                </h1>
            </div>
        </div>
    </SimpleSection>
    <SimpleSection :centered="true" class="">
        <template #subtitle>
            <div class="columns" style="max-width: 1100px;">
                <div class="column" style="background-image: url(./img/hero-background.png); border-radius:20px; height: 280px; max-width: 440px;">
                </div>
                <div class="column" style="margin-left: 3.75rem">
                    <p class="has-text-weight-medium is-size-2 has-text-left" style="line-height: 50.83px; padding-bottom: 20px;">Effect AI: Plans for 2024</p>
                    <p class="has-text-weight-normal is-size-5 has-text-left" style="line-height: 30px;">
                        Today, we're thrilled to bring forward the plans that Effect AI has in store for 2024. 
                        This year is bound to be a transformative one for Effect AI, as some of the most exciting 
                        and groundbreaking updates...
                    </p>
                </div>
            </div>
            <div class="columns" style="margin-top: 3.75rem; max-width: 1100px;">
                <div class="column" style="background-image: url(./img/hero-background.png); border-radius:20px; height: 280px; max-width: 440px;">
                </div>
                <div class="column" style="margin-left: 3.75rem">
                    <p class="has-text-weight-medium is-size-2 has-text-left" style="line-height: 50.83px; padding-bottom: 20px;">Tech Blog: On-Chain Microtasks</p>
                    <p class="has-text-weight-normal is-size-5 has-text-left" style="line-height: 30px;">
                        In this article, we’ll take a look at Effect Force’s new task creation mechanism. 
                        This technology makes it simple for people and businesses to add microtasks to the blockchain.
                    </p>
                </div>
            </div>
            <div class="columns" style="margin-top: 3.75rem; max-width: 1100px;">
                <div class="column" style="background-image: url(./img/hero-background.png); border-radius:20px; height: 280px; max-width: 440px;">
                </div>
                <div class="column" style="margin-left: 3.75rem">
                    <p class="has-text-weight-medium is-size-2 has-text-left" style="line-height: 50.83px; padding-bottom: 20px;">The Effect DAO: Effect Staking Protocol 2.0</p>
                    <p class="has-text-weight-normal is-size-5 has-text-left" style="line-height: 30px;">
                        By staking EFX, holders can improve their rank in The Effect DAO. Achieving a high rank 
                        has many benefits like vote casting, fee reward collection, and gaining privileges on the dApp level.
                    </p>
                </div>
            </div>
        </template>
    </SimpleSection>

    <SimpleSection :centered="true">
        <template #subtitle>
            <div class="columns">
                <div class="column">
                    <p class="is-size-2 has-text-weight-medium has-text-left">Explore the Frontier of AI Excellence <br> within the Effect AI Ecosystem</p>
                </div>
                <div class="column is-flex is-align-items-center is-justify-content-right">
                    <div>
                        <nuxt-link to="https://app.effect.ai/" exact-active-class="is-active">
                            <Button text="Launch App"/>
                        </nuxt-link>
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

    #main-hero{
        margin-top: -5rem;
        background-size: cover;
        padding-top: 12rem;
    }
    
</style>