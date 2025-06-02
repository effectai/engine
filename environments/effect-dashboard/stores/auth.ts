import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const account = ref<string | null>(null);
  const privateKey = useLocalStorage<string | null>("privateKey", null);
  const { init: initWeb3Auth, chainConfig } = useWeb3Auth();

  const isAuthenticated = computed(
    () => privateKey.value !== null && account.value !== null,
  );

  const initializeSolanaWallet = async () => {
    try {
      if (!privateKey.value) {
        console.error("Private key is not set");
        return;
      }

      isLoading.value = true;

      const provider = await SolanaPrivateKeyProvider.getProviderInstance({
        chainConfig,
        privKey: privateKey.value,
      });

      solanaWallet.value = new SolanaWallet(provider);
      const accounts = await solanaWallet.value.requestAccounts();
      account.value = accounts[0];
    } catch (err: any) {
      error.value = `Wallet initialization failed: ${err.message}`;
      logout();
    } finally {
      isLoading.value = false;
    }
  };

  const solanaWallet = ref<SolanaWallet | null>(null);

  watchEffect(async () => {
    if (privateKey.value) {
      await initializeSolanaWallet();
    }
  });

  const isInitialized = ref(false);
  const init = async () => {
    if (isInitialized.value) return;
    isInitialized.value = true;
    await initWeb3Auth();
  };

  const login = async (key: string) => {
    console.log("logging in..");
    privateKey.value = key;
  };

  const logout = () => {
    privateKey.value = null;
    account.value = null;
    solanaWallet.value = null;
    isLoading.value = false;
  };

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    error,

    account,
    solanaWallet,

    privateKey,

    login,
    logout,
    init,
  };
});
