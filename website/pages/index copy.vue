<template>
    <div class="is-clipped">
      <HeroSection id="main-hero" style="min-height: 700px;">
        <template #title>
          <h1 class="title is-spaced has-text-primary">
            Handcrafted Data for Artificial Intelligence.
          </h1>
        </template>
  
        <template #subtitle>
  
          <p class="subtitle pr-6" data-aos="fade-up" data-aos-delay="150">
            <span class="pr-6 has-text-black">
              Effect AI is the data network for training next-gen transparent AI
              models. Join the workforce by collecting and enriching datasets and
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

      <div class="mt-5">
        <SimpleSection data-aos="fade-left" data-aos-delay="300" id="news">
          <NewsCardList v-if="news" :items="news" />
        </SimpleSection>
      </div>
    
    </div>
  </template>
  
  <style lang="scss">

  .title{
    font-family: "Inter";
    font-size: 72px;
    font-weight: 400;
    line-height: 87.14px;
    color: black !important;
  }

  .subtitle{
    font-family: "Inter";
    font-size: 20px;
    font-weight: 400;
    line-height: 30px;
    color: #666666 !important;
  }

  #main-hero{
    position: absolute;
    background-size: cover;
    background-repeat: no-repeat;
    padding-top: 15rem;
    width: 100vw;
    background-image: url(./img/hero-background.png);
    top: 0;
    left: 0;
  }
  
  .launch-button{
    background-color: black;
    color: white;
    border-radius: 2rem;
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