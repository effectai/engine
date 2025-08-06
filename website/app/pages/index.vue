<template>
  <main class="font-inter">
    <section
      id="main-hero"
      class="relative -mt-[75px] bg-[url('/img/hero-background.png')] bg-no-repeat bg-cover px-section-x py-section-y"
    >
      <div class="relative max-w-7xl mx-auto">
        <div class="flex flex-col items-start text-left max-w-4xl">
          <h1
            class="mb-6 text-4xl sm:text-5xl md:text-6xl font-light text-gray-900 leading-tight tracking-tight"
          >
            <span>Unlocking The Next Era <br /></span>
            <span>of Composable AI Infrastructure</span>
          </h1>

          <p
            class="text-base sm:text-lg md:text-xl text-gray-700 mb-10 leading-relaxed"
          >
            AI's next revolution isn't about better models — it's about
            networked capabilities.
            <br class="hidden sm:block" />
            <span class="inline-block mt-3">
              Effect AI introduces a permissionless protocol that orchestrates
              human and machine capabilities into verifiable, reusable workflows
              — empowering developers and contributors worldwide to scale open
              AI infrastructure without intermediaries.
            </span>
          </p>

          <div class="flex flex-wrap gap-4">
            <a
              href="https://docs.effect.ai/"
              target="_blank"
              class="inline-flex items-center gap-3 rounded-full px-6 py-3 border border-black text-black hover:bg-black hover:text-white transition duration-300 shadow-sm"
            >
              Whitepaper
              <Icon
                name="material-symbols:arrow-right-alt-rounded"
                class="text-xl"
              />
            </a>

            <a
              href="https://portal.effect.ai"
              target="_blank"
              class="inline-flex items-center gap-3 rounded-full px-6 py-3 bg-black text-white hover:bg-gray-900 transition duration-300 shadow-md"
            >
              Join our Alpha
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="py-section-y pb-0 px-section-x bg-effect-black">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
        <div class="col-span-4">
          <div>
            <p
              class="text-sm text-gray-400 font-medium uppercase mb-4 tracking-wide"
            >
              Start Building with Effect AI
            </p>

            <h2 class="text-5xl text-[#D6D6D6] leading-snug mb-6 mr-12">
              Building the Future of AI Together
            </h2>

            <a
              href="https://github.com/effectai"
              target="_blank"
              class="inline-flex items-center gap-2 px-6 py-3 border border-white text-white rounded-full hover:bg-white hover:text-black transition duration-300 mt-6"
            >
              Contribute
              <Icon name="uil:github" class="text-lg" />
            </a>
          </div>
        </div>
        <div class="col-span-8">
          <Contributors
            class="flex justify-center lg:justify-start mt-5"
            :repoOwner="'effectai'"
            :repoName="'effect-js'"
            :maxContributors="10"
            :title="'Core Contributors'"
            :featured="[
              'jeisses',
              'Jeffrieh',
              'laurensV',
              'MiggySmallz',
              'rochelle8044',
            ]"
          />
        </div>
      </div>
    </section>

    <section class="py-section-y px-section-x">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
        <div class="col-span-4">
          <div
            class="absolute left-0 top-0 text-7xl text-gray-200 leading-none select-none hidden md:block"
          >
            &ldquo;
          </div>
        </div>
        <div class="col-span-8">
          <p
            class="text-4xl md:text-5xl leading-tight text-gray-800 font-light italic text-left"
          >
            Whether we are based on carbon or on silicon makes no fundamental
            difference. We should each be treated with appropriate respect.
          </p>

          <p
            class="text-xl md:text-2xl font-medium text-gray-600 text-left mt-6"
          >
            — Arthur C. Clarke
          </p>
        </div>
      </div>
    </section>
    <section class="bg-effect-black px-section-x py-section-y">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-wrap">
          <div
            class="text-gray-100 flex-1 min-w-[280px] p-6 border border-[#515053]"
          >
            <div class="space-y-4">
              <div class="text-sm font-semibold">01</div>
              <h2 class="text-4xl mb-24 font-medium text-left">
                Complete Tasks
              </h2>
              <p class="text-lg font-normal text-left">
                Complete tasks and earn EFFECT directly to your wallet.
              </p>
              <div class="mt-8 text-left">
                <a href="https://portal.effect.ai/worker">
                  <button
                    class="button flex items-center gap-2 rounded-full border border-white bg-white bg-opacity-0 hover:bg-black hover:text-white cursor-pointer hover:text-gray-900 transition px-5 py-2 text-md font-medium text-black"
                  >
                    Start Earning
                    <span class="icon text-white">
                      <i class="fas fa-arrow-right"></i>
                    </span>
                  </button>
                </a>
              </div>
            </div>
          </div>

          <div
            class="text-gray-100 flex-1 min-w-[280px] p-6 border border-[#515053]"
          >
            <div class="space-y-4">
              <div class="text-sm font-semibold">02</div>
              <h2 class="text-4xl font-medium text-left mb-24">Create Tasks</h2>
              <p class="text-lg font-normal text-left">
                Access a global, on-demand, 24x7 scalable work force.
              </p>
              <div class="mt-8 text-left">
                <button
                  class="button flex items-center gap-2 rounded-full border border-white bg-white bg-opacity-0 cursor-not-allowed px-5 py-2 text-md font-medium text-black hover:bg-black hover:text-white"
                  disabled
                >
                  Coming soon
                  <span class="icon text-white">
                    <i class="fas fa-arrow-right"></i>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-section-y px-section-x">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
        <div class="col-span-4"></div>
        <div class="col-span-8">
          <h2 class="text-5xl font-medium text-primary text-left leading-tight">
            Syncing AI and Humanity: <br />
            <span class="text-gray-500">Building the Future Together</span>
          </h2>
        </div>
        <div class="col-span-12 mt-24">
          <NewsCardList :perPage="3" :items="news" class="my-7" />
        </div>
      </div>
    </section>

    <section class="py-section-y px-section-x bg-effect-black">
      <div class="grid grid-cols-12 max-w-7xl mx-auto">
        <div class="col-span-4 flex flex-col">
          <p class="text-xs text-gray-200 font-medium uppercase mb-5">
            Some of our partners &amp; dapps
          </p>

          <h2 class="text-5xl text-[#D6D6D6] leading-snug mb-6">
            Explore the Frontier of AI Excellence within the Effect AI Ecosystem
          </h2>
        </div>

        <div class="col-span-8">
          <PartnerGrid />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
//fetch news content and sort by created\
const { data: news } = await useAsyncData("news", async () => {
  const data = await queryContent("/news").where({ published: true }).find();

  //sort on created date
  return data.sort((a, b) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });
});

useSeoMeta({
  ogDescription:
    "Effect AI is a decentralized P2P Network used to turbocharge human-driven AI tasks.",
  title: "Effect AI - Decentralized Intelligence",
  ogImage: "/img/effect-logo-black.png",
  ogTitle: "Effect AI - Decentralized Intelligence",
  description:
    "Effect AI is a decentralized P2P Network used to turbocharge human-driven AI tasks.",
});
</script>

<style lang="scss" scoped></style>
