<template>
  <div>
    <header
      class="fixed top-0 left-0 right-0 z-50 backdrop-blur bg-white/75 border-b border-gray-200"
    >
      <div
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 my-3"
      >
        <div className="flex items-center gap-2">
          <TheLogo className="w-32" />
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3 mr-6">
            <img
              v-if="profilePicture"
              :src="profilePicture"
              alt="Profile Picture"
              class="w-8 h-8 rounded-full object-cover"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"
            >
              <UIcon name="i-heroicons-user" class="w-5 h-5 text-white" />
            </div>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{
              username
            }}</span>
          </div>
        </div>
      </div>
    </header>
    <main class="pt-20 px-4 max-w-6xl mx-auto min-h-screen">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const { userInfo, logout } = useAuth();

const username = computed(() => userInfo.value?.username || "");
const profilePicture = computed(() => userInfo.value?.profileImage || "");

const logoutHandler = async () => {
  await logout();
  navigateTo("/login");
};

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
