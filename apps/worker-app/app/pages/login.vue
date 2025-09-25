<template>
  <div class="min-h-[80vh] overflow-hidden">
    <!-- Background layers -->
    <div
      class="pointer-events-none absolute inset-0 bg-[url('/img/hero-background.png')] bg-cover"
    >
      <!-- soft radial glow -->
      <div class=""></div>
      <div class=""></div>
      <!-- faint grid -->
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-90"
      ></div>
    </div>

    <div
      class="relative mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6"
    >
      <!-- 3D-ish glass card -->
      <div
        class="group relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-transform duration-300"
      >
        <!-- gradient edge / light sweep -->
        <div
          class="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10"
        >
          <div
            class="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          ></div>
          <div
            class="absolute -inset-1 -z-10 rounded-3xl bg-[radial-gradient(80%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          ></div>
        </div>

        <div class="relative p-8">
          <!-- Header -->
          <div class="text-center">
            <div
              class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
            >
              <UIcon
                name="i-heroicons-cube-transparent-20-solid"
                class="text-xl text-black"
              />
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-black">
              Effect AI · Worker Node
            </h1>
            <p class="mt-1 text-sm text-black">
              Sign in to access your worker node dashboard.
            </p>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="mt-10 space-y-6">
            <p
              class="flex items-center justify-center gap-2 text-center text-lg text-white/70"
            >
              <UIcon
                name="i-heroicons-arrow-path-20-solid"
                class="animate-spin text-white/70"
              />
              Loading… Please wait
            </p>
            <div
              class="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-white/10"
            >
              <div
                class="h-full w-1/2 animate-pulse rounded-full bg-white/40"
              ></div>
            </div>
          </div>

          <!-- Providers -->
          <div v-else class="mt-8 space-y-6">
            <div v-if="!option" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <UButton
                  block
                  color="neutral"
                  variant="outline"
                  class="justify-start gap-2 rounded-xl border-white/20 bg-white/5 text-black hover:bg-white/90 cursor-pointer"
                  @click="loginWithGoogle"
                >
                  <UIcon name="i-logos-google-icon" />
                  Google
                </UButton>

                <UButton
                  block
                  color="neutral"
                  variant="outline"
                  class="justify-start gap-2 rounded-xl border-white/20 bg-white/5 text-black hover:bg-white/90 cursor-pointer"
                  @click="loginWithGithub"
                >
                  <UIcon
                    name="i-logos-github-icon"
                    mode="svg"
                    class="fill-white"
                  />
                  GitHub
                </UButton>
              </div>

              <UButton
                block
                color="neutral"
                variant="outline"
                class="w-full justify-start gap-2 rounded-xl border-white/20 bg-white/5 text-black hover:bg-white/90 cursor-pointer"
                @click="loginWithDiscord"
              >
                <UIcon
                  mode="svg"
                  class="text-indigo-400"
                  name="i-logos-discord-icon"
                />
                Discord
              </UButton>

              <!-- Divider -->
              <div class="relative py-2">
                <div class="absolute inset-0 flex items-center">
                  <div
                    class="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  ></div>
                </div>
                <div class="relative flex justify-center">
                  <span
                    class="rounded-full bg-white/5 px-3 py-1 text-xs text-black ring-1 ring-white/10"
                  >
                    Or continue with
                  </span>
                </div>
              </div>

              <UButton
                block
                color="neutral"
                variant="outline"
                class="w-full justify-start gap-2 rounded-xl border-white/20 bg-gradient-to-tr from-white/5 to-white/[0.02] text-black hover:bg-white/90 cursor-pointer"
                @click="option = 'privateKey'"
              >
                <UIcon name="material-symbols:key" />
                Private Key
              </UButton>

              <!-- tiny footnote -->
              <p class="pt-1 text-center text-xs text-black"></p>
            </div>

            <div v-else class="mt-2">
              <LoginWithPrivateKey @back="option = null" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { web3Auth, loginWithWeb3Auth } = useAuth();

definePageMeta({
  middleware: ["auth"],
});

const option: Ref<string | null> = ref(null);

const loginWithGoogle = async () => {
  loginWithWeb3Auth("google");
};

const loginWithGithub = async () => {
  loginWithWeb3Auth("github");
};

const loginWithDiscord = async () => {
  loginWithWeb3Auth("discord");
};
</script>

<script setup lang="ts"></script>

<style scoped></style>
