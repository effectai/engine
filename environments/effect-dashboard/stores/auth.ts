import { web3 } from "@coral-xyz/anchor";
import { AuthAdapter } from "@web3auth/auth-adapter";
import {
  CHAIN_NAMESPACES,
  UX_MODE,
  WEB3AUTH_NETWORK,
  type Web3AuthNoModalOptions,
} from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { SOLANA_CHAIN_IDS } from "@web3auth/ws-embed";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

const clientId =
  "BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: SOLANA_CHAIN_IDS.SOLANA_MAINNET, // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
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

const web3auth: Web3AuthNoModal = new Web3AuthNoModal(web3AuthOptions);

export const useAuthStore = defineStore("auth", () => {
  const username = ref("Anonymous User");
  const profilePicture = ref<string | null>(null);
  const account = ref<string | null>(null);
  const wallet = ref<SolanaWallet | null>(null);
  const isAuthenticated = computed(() => !!wallet.value);

  async function setProvider(privateKey: string) {
    const providerInstance = await SolanaPrivateKeyProvider.getProviderInstance(
      {
        chainConfig,
        privKey: privateKey,
      },
    );

    wallet.value = new SolanaWallet(providerInstance);
    account.value = (await wallet.value.requestAccounts())[0];
  }

  async function loginWithPrivateKey(privateKey: string) {
    localStorage.setItem("loginMethod", "privateKey");
    localStorage.setItem("privateKey", privateKey);
    await setProvider(privateKey);
    username.value = "Anonymous User";
    profilePicture.value = null;
  }

  const isWeb3AuthInitialized = ref(false);
  async function initWeb3Auth() {
    if (isWeb3AuthInitialized.value) return;
    web3auth.configureAdapter(authAdapter);
    await web3auth.init();
  }

  async function loginWithWeb3Auth() {
    if (!isWeb3AuthInitialized) {
      await initWeb3Auth();
    }

    if (!web3auth.provider) {
      throw new Error("Web3Auth provider is not initialized");
    }

    const privateKey = await web3auth.provider.request({
      method: "solanaPrivateKey",
    });

    if (!privateKey) {
      throw new Error("Failed to retrieve private key from Web3Auth");
    }

    setProvider(privateKey as string);
    localStorage.setItem("loginMethod", "web3auth");

    const userInfo = await web3auth.getUserInfo();
    username.value = userInfo.name || userInfo.email || "Web3 User";
    profilePicture.value = userInfo.profileImage || null;
  }

  function logout() {
    localStorage.clear();
    username.value = "Anonymous User";
  }

  async function autoConnect() {
    const method = localStorage.getItem("loginMethod");
    const pk = localStorage.getItem("privateKey");

    if (method === "privateKey" && pk) {
      loginWithPrivateKey(pk);
    }

    if (method === "web3auth" && web3auth) {
      await initWeb3Auth();
      if (web3auth.provider) {
        await loginWithWeb3Auth();
      }
    }
  }

  return {
    username,
    isAuthenticated,
    account,
    wallet,
    web3auth,

    initWeb3Auth,

    loginWithPrivateKey,
    loginWithWeb3Auth,
    logout,
    autoConnect,
  };
});
