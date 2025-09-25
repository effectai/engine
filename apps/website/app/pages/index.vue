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

          <div class="flex flex-wrap gap-6">
            <a
              href="/whitepaper.pdf"
              target="_blank"
              class="inline-flex items-center gap-3 rounded-full px-6 py-3 transition duration-299 shadow-md hover:shadow-lg bg-[#E2FF03] text-black hover:border-black text-black border-1 border-black"
            >
              Whitepaper
              <Icon
                name="material-symbols:arrow-right-alt-rounded"
                class="text-xl"
              />
            </a>
            <a
              href="https://jup.ag/swap?sell=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&buy=EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E"
              target="_blank"
              class="underline inline-flex items-center gap-2 text-lg text-gray-800 font-medium hover:text-gray-600 transition text-sm"
            >
              Trade EFFECT on JUP
              <Icon name="i-lucide:external-link" class="text-xl" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Apps Showcase -->
    <section class="px-section-x py-section-y bg-effect-black">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-10">
          <p class="text-xs uppercase tracking-wider text-gray-300">
            Explore our apps
          </p>
          <h2 class="mt-2 text-3xl md:text-5xl font-semibold text-[#D6D6D6]">
            Build, Earn & Scale — all within Effect AI
          </h2>
        </div>

        <!-- Cards -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Worker -->
          <div
            class="group relative overflow-hidden border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-colors hover:border-white/20"
          >
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm text-gray-300">01</span>
              <div class="flex gap-2">
                <span
                  class="rounded-full border px-2.5 py-1 text-xs font-medium text-white"
                >
                  Alpha
                </span>
                <span
                  class="rounded-full border border-white/30 bg-[#E2FF03] px-2.5 py-1 text-xs font-medium"
                >
                  Flagship
                </span>
              </div>
            </div>
            <h3 class="text-xl font-semibold text-white">Worker</h3>
            <p class="mt-2 text-sm leading-6 text-gray-300">
              Complete tasks and earn EFFECT directly to your wallet with
              low-friction payouts.
            </p>
            <div class="mt-6 flex items-center gap-4 w-full justify-between">
              <a
                href="https://worker.effect.ai"
                target="_blank"
                class="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Open Worker
                <Icon
                  name="material-symbols:arrow-right-alt-rounded"
                  class="text-lg"
                />
              </a>
              <a
                href="https://github.com/effectai/engine/tree/main/apps/worker-app"
                class="inline-flex items-center bg-white rounded-full p-1 hover:bg-gray-200 transition"
                ><Icon name="octicon:mark-github-16" class="text-black text-xl"
              /></a>
            </div>
            <div
              class="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            ></div>
          </div>

          <!-- Staking -->
          <div
            class="group relative overflow-hidden border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-colors hover:border-white/20"
          >
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm text-gray-300">02</span>
              <span
                class="rounded-full border px-2.5 py-1 text-xs font-medium bg-[#E2FF03] text-black"
              >
                Live
              </span>
            </div>
            <h3 class="text-xl font-semibold text-white">Staking</h3>
            <p class="mt-2 text-sm leading-6 text-gray-300">
              Stake EFFECT to secure the network and share in protocol rewards.
            </p>
            <div class="mt-6 flex items-center gap-4 w-full justify-between">
              <a
                href="https://staking.effect.ai"
                target="_blank"
                class="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Open Staking
                <Icon
                  name="material-symbols:arrow-right-alt-rounded"
                  class="text-lg"
                />
              </a>
              <a
                href="https://github.com/effectai/engine/tree/main/apps/staking-app"
                class="inline-flex items-center bg-white rounded-full p-1 hover:bg-gray-200 transition"
                ><Icon name="octicon:mark-github-16" class="text-black text-xl"
              /></a>
            </div>
            <div
              class="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            ></div>
          </div>
          <!-- Migration -->
          <div
            class="group relative overflow-hidden border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-colors hover:border-white/20"
          >
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm text-gray-300">03</span>
              <span
                class="rounded-full border px-2.5 py-1 text-xs font-medium bg-[#E2FF03] text-black"
              >
                Live
              </span>
            </div>
            <h3 class="text-xl font-semibold text-white">Migration</h3>
            <p class="mt-2 text-sm leading-6 text-gray-300">
              Migrate deprecated $EFX tokens to the new EFFECT on Solana with a
              guided, secure flow.
            </p>
            <div class="mt-6 flex items-center gap-4 w-full justify-between">
              <a
                href="https://migrate.effect.ai"
                target="_blank"
                class="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Open Migration
                <Icon
                  name="material-symbols:arrow-right-alt-rounded"
                  class="text-lg"
                />
              </a>
              <a
                href="https://github.com/effectai/engine/tree/main/apps/migration-app"
                class="inline-flex items-center bg-white rounded-full p-1 hover:bg-gray-200 transition"
                ><Icon name="octicon:mark-github-16" class="text-black text-xl"
              /></a>
            </div>
            <!-- subtle spotlight -->
            <div
              class="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            ></div>
          </div>
        </div>

        <!-- Secondary CTA -->
        <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p class="text-sm text-gray-300">
            Discover how Effect AI can power your applications — request a demo
            to get started with our team.
          </p>
          <a
            href="https://effectai.formaloo.co/xj6xry"
            target="_blank"
            class="inline-flex items-center gap-2 rounded-full px-5 py-2 bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Request Demo
            <Icon
              name="material-symbols:arrow-right-alt-rounded"
              class="text-lg"
            />
          </a>
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

    <section
      class="py-section-y pb-0 px-section-x bg-effect-black overflow-hidden"
    >
      <div
        class="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto gap-y-12 lg:gap-y-0 space-y-8 lg:space-y-0"
      >
        <div class="col-span-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-gray-300">
              Start Building with Effect AI
            </p>

            <h2 class="mt-2 text-3xl md:text-5xl font-semibold text-[#D6D6D6]">
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
            Partners & Ecosystem
          </p>

          <h2 class="mt-2 text-3xl md:text-5xl font-semibold text-[#D6D6D6]">
            Collaborating with Industry Leaders
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
