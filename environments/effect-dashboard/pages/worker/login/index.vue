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
    <div v-else>
      <UButton
        block
        color="white"
        variant="outline"
        class="justify-start gap-2"
        @click="web3auth.logout()"
      >
        <UIcon name="i-logos-solana-icon" />
        Disconnect
      </UButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { AuthAdapter } from "@web3auth/auth-adapter";
import {
  CHAIN_NAMESPACES,
  UX_MODE,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
  type Web3AuthNoModalOptions,
} from "@web3auth/base";
import { SOLANA_CHAIN_IDS as CHAIN_IDS } from "@web3auth/ws-embed";
import { Web3AuthNoModal } from "@web3auth/no-modal";

const clientId =
  "BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: CHAIN_IDS.SOLANA_MAINNET, // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
  rpcTarget: "https://marni-l6uvpy-fast-mainnet.helius-rpc.com",
  displayName: "Solana Mainnet",
  blockExplorerUrl: "https://explorer.solana.com",
  ticker: "SOL",
  tickerName: "Solana",
  decimals: 9,
  logo: "https://images.toruswallet.io/solana.svg",
};

const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
});

const authAdapter = new AuthAdapter({
  privateKeyProvider,
  adapterSettings: {
    uxMode: UX_MODE.REDIRECT,
  },
});

const web3AuthOptions: Web3AuthNoModalOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
  chainConfig,
};

const web3auth = ref(new Web3AuthNoModal(web3AuthOptions));
const isConnected = computed(() => authState.isConnected);
const privateKey = useLocalStorage("privateKey", null);

const authState = reactive({
  isConnected: false,
  isLoading: true,
  error: null as Error | null,
});

const init = async () => {
  try {
    authState.isLoading = true;
    web3auth.value.configureAdapter(authAdapter);

    web3auth.value.on("connected", async () => {
      authState.isConnected = true;

      //request private key
      privateKey.value = await web3auth.value.provider?.request({
        method: "solanaPrivateKey",
      });
    });

    web3auth.value.on("disconnected", () => {
      authState.isConnected = false;
    });

    web3auth.value.on("errored", (error) => {
      authState.error = error;
      authState.isLoading = false;
    });

    await web3auth.value.init();

    authState.isConnected = web3auth.value.status === "connected";
    authState.isLoading = false;
  } catch (error) {
    authState.error = error as Error;
    authState.isLoading = false;
    console.error(error);
  }
};

onMounted(async () => {
  try {
    init();
  } catch (error) {
    console.error(error);
  }
});

watchEffect(() => {
  if (privateKey.value) {
    navigateTo("/worker");
  }
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
