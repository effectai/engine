<template>
  <div>
    <header
      class="fixed top-0 left-0 right-0 z-50 backdrop-blur bg-white/75 border-b border-gray-200"
    >
      <div
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 my-3"
      >
        <div className="flex items-center gap-2">
          <NuxtLink to="/"><TheLogo className="w-32" /></NuxtLink>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3 mr-6">
            <UDropdownMenu
              v-if="username"
              :items="items"
              :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width)' }"
            >
              <UButton label="Open" color="neutral" variant="outline">
                <span
                  class="font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2 gap-3"
                >
                  <img
                    v-if="profilePicture"
                    :src="profilePicture"
                    alt="Profile Picture"
                    class="w-8 h-8 rounded-full object-cover"
                  />

                  {{ username }}
                </span>
              </UButton>
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>
    <main class="pt-22 px-4 max-w-6xl mx-auto min-h-screen">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const { userInfo, logout } = useAuth();
const { destroy } = useWorkerStore();

const username = computed(() => userInfo.value?.username || "");
const profilePicture = computed(() => userInfo.value?.profileImage || "");

const logoutHandler = async () => {
  await logout();
  await destroy();
  navigateTo("/login");
};

const items: DropdownMenuItem[][] = [
  [
    {
      onSelect: () => logoutHandler(),
      label: "Logout",
      color: "error",
      icon: "i-lucide-log-out",
    },
  ],
];

useSeoMeta({
  title: "Effect AI | Worker App",
  ogTitle: "Effect AI | Worker App",
  description: "The Effect AI Worker App",
  ogDescription: "The Effect AI Worker App",
  ogImage: "/img/effect-logo-black.png",
});
</script>

<style scoped></style>
