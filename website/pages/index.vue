<template>
    <div>
        <HeroSection id="main-hero" style="min-height: 700px;">
            <template #title>
                <h1 class="title title-weight is-spaced has-text-primary">
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
                <div
                    class="is-flex is-size-3 is-align-items-center is-primary has-text-primary is-in-front"
                    data-aos="fade-left"
                    data-aos-delay="550"
                >
                    <div>
                        <a href="https://app.effect.ai/" target="_blank" class="button is-primary launch-button"
                            exact-active-class="is-active">
                            Launch App
                            <div id="button-arrow"><img src="/img/arrow-vector.svg" alt="arrow vector" /></div>
                        </a>
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

    <SimpleSection :centered="true" class="task-cards">
      <template #subtitle>
        <div class="columns">
            <div class="column mr-6" style="height: 472px; background-image: url(./img/hero-background.png);">
                <p class="is-size-2 has-text-weight-medium has-text-left has-text-black">Complete Tasks</p>
                <p class="is-size-5 has-text-weight-normal has-text-left">Complete tasks and earn EFX directly to your wallet.</p>
                <div class="mt-5 has-text-left">
                    <a href="https://app.effect.ai/" target="_blank" class="button is-primary launch-button"
                        exact-active-class="is-active">
                        Join the Workforce
                        <div id="button-arrow"><img src="/img/arrow-vector.svg" alt="arrow vector" /></div>
                    </a>
                </div>
            </div>
            <div class="column" style="background-image: url(./img/hero-background.png);">
                <p class="is-size-2 has-text-weight-medium has-text-left has-text-black">Create Tasks</p>
                <p class="is-size-5 has-text-weight-normal has-text-left">Access a global, on-demand, 24x7 scalable work force.</p>
                <div class="mt-5 has-text-left">
                    <a href="https://app.effect.ai/" target="_blank" class="button is-primary launch-button"
                        exact-active-class="is-active">
                        Create a Task
                        <div id="button-arrow"><img src="/img/arrow-vector.svg" alt="arrow vector" /></div>
                    </a>
                </div>
            </div>
        </div>
      </template>
    </SimpleSection>

    <SimpleSection :centered="true" class="achievement-banner">
      <template #subtitle>
        <div class="columns">
            <div class="column">
                <p class="is-size-2 has-text-weight-medium has-text-left">Be part of the <br> AI future:</p>
            </div>
            <div class="column"></div>
            <div class="column">
                <p class="achievment-number">
                    22
                </p>
                <p class="achievment-text">Apps in Ecosystem</p>
            </div>
            <div class="column">
                <p class="achievment-number">
                    22M
                </p>
                <p class="achievment-text">Tasks Completed</p>
            </div>
            <div class="column">
                <p class="achievment-number">
                    156
                </p>
                <p class="achievment-text">Proposals created</p>
            </div>
        </div>
      </template>
    </SimpleSection>

</template>
 
  <style lang="scss">
    .achievement-banner{
        height: 291px;
        background-color: black;
        color: white;

        .achievment-number{
            font-size: 4.25rem;
            font-weight: 700;
            line-height: 95.2px;
            text-align: left;
        }

        .achievment-text{
            font-size: 1.25rem;
            font-weight: 400;
            line-height: 28px;
            text-align: left;
            color: #999999;
        }
    }

    .task-cards{
        background: linear-gradient(to bottom,#D9D9D91A,#D9D9D91A);

        .column{
            padding-top: 264px;
            padding-left: 50px;
        }
    }

    .subtitle{
        width: 120%;
    }

    #main-hero{
        margin-top: -5rem;
        background-size: cover;
        background-repeat: no-repeat;
        padding-top: 12rem;
        width: 100vw;
        background-image: url(./img/hero-background.png);
        z-index: -1;
    }

    .launch-button{
        background-color: black;
        color: white !important;
        border-radius: 2rem !important;
        height: 2.8em!important;
        padding-right: 0.5em!important;
        font-family: Inter;
        font-size: 16px;
        font-weight: 400;
        line-height: 16px;
    }

    #button-arrow{
        width: 2em;
        height: 2em;
        background-color: white;
        border-radius: 50%;
        margin-left: 1.2rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
</style>