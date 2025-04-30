<template>
  <div class="flex items-center justify-center">
    <div class="w-full max-w-md space-y-8 p-8" v-if="!isConnected">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight">
          Effect Worker Dashboard
        </h1>
        <p class="mt-2 text-sm text-gray-400">
          Sign in to access the dashboard
        </p>
      </div>

      <div class="space-y-4">
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
            @click="navigateTo('/worker/login/with-private-key')"
          >
            <UIcon name="i-logos-solana-icon" />
            Private Key (advanced)
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UX_MODE, WALLET_ADAPTERS } from "@web3auth/base";

const { web3auth, authState, privateKey, init } = useWeb3Auth();

onMounted(() => {
  init();
});

definePageMeta({
  layout: "worker",
});

watchEffect(() => {
  if (!privateKey.value) {
    return;
  }
  navigateTo("/worker/connect");
});

const loginWithGoogle = async () => {
  await web3auth.value.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "google",
  });
};

const loginWithGithub = async () => {
  await web3auth.value.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "github",
  });
};

const loginWithDiscord = async () => {
  await web3auth.value.connectTo(WALLET_ADAPTERS.AUTH, {
    loginProvider: "discord",
  });
};
</script>

<script setup lang="ts"></script>

<style scoped></style>
