<template>
  <main class="font-inter">
    <section
      id="main-hero"
      class="relative -mt-[75px] bg-[url('/img/hero-background.png')] bg-no-repeat bg-cover px-section-x py-section-y"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_30%,rgba(255,255,255,0.55),transparent_60%)] mix-blend-screen"
      ></div>

      <div class="relative max-w-7xl mx-auto">
        <div class="flex flex-col items-start text-left max-w-4xl">
          <h1
            class="mb-6 mt-10 text-4xl sm:text-5xl md:text-6xl font-light text-gray-900 leading-tight tracking-tight"
          >
            <span>Unlocking the Next Era <br /></span>
            <span
              >of {{ typed }}
              <span
                class="inline-block align-top select-none"
                :style="{ opacity: caretVisible ? 1 : 0 }"
                >|</span
              >
            </span>
          </h1>
          <p class="text-base text-xl text-gray-700 mb-10 leading-relaxed">
            <br class="hidden sm:block" />
            <span class="inline-block mt-3 md:hidden">
              A decentralized protocol for building, sharing, and earning from
              AI infrastructure powered by humans and machines.
            </span>
            <span class="hidden md:inline-block">
              Effect AI is a decentralized protocol for building, sharing, and
              earning from AI infrastructure powered by humans and machines. It
              connects people, models, and compute into a unified capability
              network for scalable, real-time AI execution.
            </span>
          </p>

          <div class="flex flex-wrap gap-4">
            <a
              href="/whitepaper.pdf"
              target="_blank"
              class="inline-flex items-center gap-3 rounded-full px-6 py-3 border border-black text-black hover:bg-black hover:text-white transition duration-300 shadow-sm hover:shadow-md"
            >
              Whitepaper
              <Icon
                name="material-symbols:arrow-right-alt-rounded"
                class="text-xl"
              />
            </a>

            <a
              href="https://worker.effect.ai"
              target="_blank"
              class="inline-flex items-center gap-3 rounded-full px-6 py-3 bg-black text-white hover:bg-gray-900 transition duration-300 shadow-md hover:shadow-lg"
            >
              Join our Alpha
            </a>
          </div>
        </div>
      </div>
    </section>

    <section
      class="py-section-y pb-0 px-section-x bg-effect-black overflow-hidden"
    >
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
          <Contributors class="flex justify-center lg:justify-start mt-5" />
        </div>
      </div>
    </section>

    <section class="py-section-y px-section-x">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
        <div class="col-span-4 relative">
          <div
            class="absolute left-0 top-0 text-7xl text-gray-200 leading-none select-none"
          >
            &ldquo;
          </div>
        </div>
        <div class="col-span-8">
          <p
            class="text-4xl md:text-5xl leading-tight text-gray-800 font-light italic text-left"
          >
            One machine can do the work of fifty ordinary men. No machine can do
            the work of one extraordinary man.
          </p>

          <p
            class="text-xl md:text-2xl font-medium text-gray-600 text-left mt-6"
          >
            — Elbert Hubbard
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
            <div class="space-y-4 flex flex-col h-full">
              <div class="text-sm font-semibold">01</div>
              <h2 class="text-4xl font-medium text-left">Complete Tasks</h2>
              <p class="text-lg font-normal text-left flex-1 mt-12">
                Put your skills or resources to work and get paid instantly in
                EFFECT, directly to your wallet. Choose from a variety of
                available tasks and start earning today.
              </p>
              <div class="mt-8 text-left">
                <a href="https://worker.effect.ai">
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
            <div class="space-y-4 flex flex-col h-full">
              <div class="text-sm font-semibold">02</div>
              <h2 class="text-4xl font-medium text-left">Build AI Workflows</h2>
              <p class="text-lg font-normal text-left space-y-4 flex-1 mt-12">
                Deploy your own decentralized applications with your specific
                use case on Effect AI. Design custom workflows, post tasks, and
                tap into a decentralized global worker mesh.
              </p>
              <div class="mt-8 text-left">
                <a href="https://effectai.formaloo.co/xj6xry" target="_blank"
                  ><button
                    class="button flex items-center gap-2 rounded-full border border-white bg-white bg-opacity-0 cursor-pointer px-5 py-2 text-md font-medium text-black hover:bg-black hover:text-white"
                  >
                    Request Demo
                    <span class="icon text-white">
                      <i class="fas fa-arrow-right"></i>
                    </span></button
                ></a>
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
            <span class="text-gray-500">Creating What Comes Next</span>
          </h2>
        </div>
        <div class="col-span-12 lg:mt-24">
          <NewsCardList
            v-if="news && news.length"
            :items="news"
            :per-page="3"
          />
        </div>
      </div>
    </section>

    <section class="py-section-y px-section-x bg-effect-black overflow-hidden">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
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
const route = useRoute();

const { data: news } = await useAsyncData(route.path, async () => {
  const data = await queryCollection("news")
    .where("published", "=", true)
    .all();

  //sort on created date
  return data.sort((a, b) => {
    return (
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
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

const phrases = [
  "Composable AI Infrastructure.",
  "Decentralized Intelligence.",
  "AI Workflows.",
];

const isActive = ref(true);
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isActive.value = entry.isIntersecting;
      });
    },
    { threshold: 0.1 },
  );
  const hero = document.getElementById("main-hero");

  if (hero) {
    observer.observe(hero);
  }
});
const { text: typed, caretVisible } = useTypewriter(phrases, isActive, {
  speed: 45,
  backSpeed: 30,
  hold: 5000,
  between: 800,
});
</script>

<style lang="scss" scoped>
  @media (min-width: 1024px) {
    #main-hero {
      background-attachment: fixed;
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    #main-hero {
      background-attachment: scroll;
    }
  }
</style>
