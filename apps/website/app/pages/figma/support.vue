<template>
  <main class="font-inter">
    <section class="px-section-x py-20 border-b border-gray-100">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-2">Effect AI · Figma Plugin</p>
        <h1 class="text-4xl md:text-5xl font-light text-gray-900 leading-tight">
          Support
        </h1>
        <p class="mt-4 text-base text-gray-500 max-w-xl">
          Need help with the VibeCheck Figma plugin? We're here for you.
        </p>
      </div>
    </section>

    <section class="px-section-x py-section-y">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        <!-- Contact column -->
        <div class="lg:col-span-4 space-y-8">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>

            <div class="space-y-4">
              <a
                href="mailto:hello@effect.ai"
                class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition group"
              >
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 transition shrink-0">
                  <Icon name="material-symbols:mail-outline-rounded" class="text-gray-700 text-xl" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Email Support</p>
                  <p class="text-sm text-gray-500">hello@effect.ai</p>
                </div>
              </a>

              <a
                href="https://discord.gg/effectnetwork"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition group"
              >
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 transition shrink-0">
                  <Icon name="line-md:discord" class="text-gray-700 text-xl" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Discord Community</p>
                  <p class="text-sm text-gray-500">discord.gg/effectnetwork</p>
                </div>
              </a>

              <a
                href="https://t.me/effectai"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition group"
              >
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 transition shrink-0">
                  <Icon name="line-md:telegram" class="text-gray-700 text-xl" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Telegram</p>
                  <p class="text-sm text-gray-500">t.me/effectai</p>
                </div>
              </a>
            </div>
          </div>

          <div class="border-t border-gray-100 pt-8">
            <p class="text-sm text-gray-500">
              Also see our
              <a href="https://docs.effect.ai/" target="_blank" rel="noopener" class="underline hover:text-gray-700">documentation</a>
              and
              <NuxtLink to="/figma/terms" class="underline hover:text-gray-700">terms</NuxtLink> /
              <NuxtLink to="/figma/privacy" class="underline hover:text-gray-700">privacy policy</NuxtLink>.
            </p>
          </div>
        </div>

        <!-- FAQ column -->
        <div class="lg:col-span-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div class="divide-y divide-gray-100">
            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                What does the VibeCheck plugin do?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                VibeCheck lets you submit your Figma designs for review by real human workers on the
                Effect AI decentralised network. Workers assess your design for visual clarity,
                clickability, or comparative preference, based on the check type you select.
                You receive aggregated, anonymous feedback directly in the Figma plugin panel.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                Who reviews my design?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                Your design is reviewed by pseudonymous workers participating in the Effect AI
                network. Workers see your exported design image and any context you provide, but
                not your name or Figma account email. Results are aggregated before being shown
                to you.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                How long does a review take?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                Review time depends on worker availability and the number of workers you request.
                The Plugin shows an estimated wait time on the submission screen. You can close the
                plugin and return later. Your results will be waiting in the History view when all
                workers have responded.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                What happens to my design images?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                When you submit a task, your design is exported as a PNG and uploaded to IPFS
                (a decentralised content-addressed storage network) so workers can access it via a
                permanent URL. This URL is publicly retrievable by anyone who has it, so please do
                not submit designs that contain sensitive or confidential information, as IPFS
                content may persist beyond our ability to remove it. See our
                <NuxtLink to="/figma/privacy" class="underline">Privacy Policy</NuxtLink> for full
                details.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                Can I delete my tasks and results?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                Yes. You can delete individual tasks from the History view inside the Plugin. For a
                full data deletion request, contact us at
                <a href="mailto:hello@effect.ai" class="underline">hello@effect.ai</a>.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                What should I do if my task is stuck on pending?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                Tasks remain pending until all requested workers have submitted their responses.
                If your task has been pending for longer than a few hours, reach out on
                <a href="https://discord.gg/effectnetwork" target="_blank" rel="noopener" class="underline">Discord</a>
                or email us at
                <a href="mailto:hello@effect.ai" class="underline">hello@effect.ai</a>
                with your task ID (visible in the History view) and we'll investigate.
              </p>
            </details>

            <details class="group py-5">
              <summary class="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 list-none">
                Is the Plugin free to use?
                <Icon name="material-symbols:keyboard-arrow-down-rounded" class="text-gray-400 text-xl transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">
                The Plugin is currently in early access. Contact us or join our Discord for the
                latest information on pricing and availability.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Support | VibeCheck Figma Plugin",
  description:
    "Get help with the VibeCheck Figma plugin. Find answers to common questions or contact our support team.",
});
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
