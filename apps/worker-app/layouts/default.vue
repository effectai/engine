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
