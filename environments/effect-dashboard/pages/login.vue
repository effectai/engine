<template>
  <div class="flex items-center justify-center">
    <div v-if="authStore.isLoading" class="w-full max-w-md mt-10 space-y-8 p-8">
      <p class="text-center text-gray-400 text-2xl flex items-center gap-2">
        <UIcon
          name="i-heroicons-arrow-path-20-solid"
          class="animate-spin text-gray-400"
        />
        Loading.. Please wait.
      </p>
    </div>
    <div v-else class="w-full max-w-md space-y-8 p-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight">
          Effect Worker Dashboard
        </h1>
        <p class="mt-2 text-sm text-gray-400">
          Sign in to access the dashboard
        </p>
      </div>

      <div class="space-y-4" v-if="!option">
        <div class="flex flex-wrap gap-2 text-center">
          <UButton
            block
            color="white"
            variant="outline"
            class="flex-1 w-[50%] justify-start gap-2"
            @click="loginWithGoogle"
          >
            <UIcon name="i-logos-google-icon" />
            Google
          </UButton>

          <UButton
            block
            color="white"
            variant="outline"
            class="flex-1 w-[50%] justify-center gap-2 !fill-white"
            @click="loginWithGithub"
          >
            <UIcon name="i-logos-github-icon" mode="svg" class="fill-white" />
            GitHub
          </UButton>

          <UButton
            block
            color="white"
            variant="outline"
            class="justify-start gap-2"
            @click="loginWithDiscord"
          >
            <UIcon
              mode="svg"
              class="text-green-500 fill-white"
              name="i-logos-discord-icon"
            />
            Discord
          </UButton>
        </div>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="dark:bg-gray-950 bg-white px-2 text-gray-400"
              >Or continue with</span
            >
          </div>
        </div>

        <div class="flex">
          <UButton
            block
            color="white"
            variant="outline"
            class="justify-start gap-2"
            @click="option = 'privateKey'"
          >
            <UIcon name="material-symbols:key" />
            Private Key
          </UButton>
        </div>
      </div>
      <div v-else>
        <LoginWithPrivateKey />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { WALLET_ADAPTERS } from "@web3auth/base";

definePageMeta({
  layout: "worker",
  middleware: "auth",
});

const authStore = useAuthStore();
const { web3auth } = useWeb3Auth();
const option: Ref<string | null> = ref(null);

const route = useRoute();
const router = useRouter();

// After successful login:
watchEffect(async () => {
  if (authStore.isAuthenticated) {
    const returnTo = route.query.returnTo;
    const redirectPath = returnTo
      ? decodeURIComponent(returnTo as string)
      : "/worker/connect";
    await router.push(redirectPath);
  }
});

const loginWithGoogle = async () => {
  await web3auth.value?.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "google",
  });
};

const loginWithGithub = async () => {
  await web3auth.value?.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "github",
  });
};

const loginWithDiscord = async () => {
  await web3auth.value?.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "discord",
  });
};
</script>

<script setup lang="ts"></script>

<style scoped></style>
