<template>
  <div class="">
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div
                  class="absolute left-full top-0 flex w-16 justify-center pt-5"
                >
                  <button
                    type="button"
                    class="-m-2.5 p-2.5"
                    @click="sidebarOpen = false"
                  >
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="size-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>
              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div
                class="flex grow flex-col gap-y-5 overflow-y-auto dark:bg-black px-6 pb-4"
              >
                <div class="flex h-16 shrink-0 items-center">
                  <nuxt-link to="/">
                    <TheLogo />
                  </nuxt-link>
                </div>
                <TheNavigation />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    >
      <div
        class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:bg-brand-black dark:border-black px-6 pb-4"
      >
        <div class="flex h-16 shrink-0 items-center">
          <nuxt-link to="/">
            <TheLogo />
          </nuxt-link>
        </div>
        <TheNavigation />
      </div>
    </div>

    <div class="lg:pl-72">
      <div class="sticky top-0 z-40 lg:mx-auto lg:max-w-5xl lg:px-8">
        <div
          class="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white dark:bg-[Canvas] dark:border-black px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none"
        >
          <button
            type="button"
            class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            @click="sidebarOpen = true"
          >
            <span class="sr-only">Open sidebar</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>

          <!-- Separator -->

          <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form class="relative flex flex-1" action="#" method="GET"></form>
            <div class="flex items-center gap-x-4 lg:gap-x-6">
              <ColorModeButton />
              <!-- Separator -->
              <div
                class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
                aria-hidden="true"
              />

              <!-- Wallet dropdown -->
              <Menu as="div" class="relative">
                <MenuButton class="-m-1.5 flex items-center p-1.5">
                  <ClientOnly>
                    <WalletMultiButton />
                  </ClientOnly>
                </MenuButton>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      <main class="py-2">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <slot></slot>
        </div>
      </main>
    </div>

    <UModals />
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { WalletMultiButton } from "solana-wallets-vue";
import { ref } from "vue";

import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";

const sidebarOpen = ref(false);

useSeoMeta({
  title: "Effect AI | Portal",
  ogTitle: "Effect AI | Portal",
  description: "The Effect AI Portal",
  ogDescription: "The Effect AI Portal",
  ogImage: "/img/effect-logo-black.png",
});
</script>

<style scoped></style>
