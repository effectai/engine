import { generateKeyPairFromSeed } from "@effectai/protocol";
import { AuthAdapter } from "@web3auth/auth-adapter";
import {
  CHAIN_NAMESPACES,
  UX_MODE,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
  type Web3AuthNoModalOptions,
} from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { SOLANA_CHAIN_IDS } from "@web3auth/ws-embed";
import { ref, useState } from "#imports";

type UserInfo = {
  username: string;
  profileImage: string;
};

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

export const useAuth = () => {
  const web3Auth = useState<Web3AuthNoModal | null>("web3auth", () => null);
  const provider = useState<SolanaWallet | null>("provider", () => null);
  const userInfo = useState<UserInfo | null>("userInfo", () => null);
  const account = useState<string | null>("account", () => null);
  const isAuthenticated = useState<boolean>("isAuthenticated", () => false);
  const error = ref<string | null>(null);

  // In memory storage for private key
  const privateKey = useState<string | null>("privateKey", () => null);

  async function setProvider(privateKey: string) {
    const privateKeyBytes = Buffer.from(privateKey, "hex").slice(0, 32);

    const tagBytes = await generateDeterministicSeed();
    const modifiedSeed = modifySeedLast4Bytes(privateKeyBytes, tagBytes);

    const keypair = await generateKeyPairFromSeed("Ed25519", modifiedSeed);

    const providerInstance = await SolanaPrivateKeyProvider.getProviderInstance(
      {
        chainConfig,
        privKey: Buffer.from(keypair.raw).toString("hex"),
      },
    );

    provider.value = new SolanaWallet(providerInstance);
    account.value = (await provider.value.requestAccounts())[0];
  }

  const requestPrivateKey = async (): Promise<string> => {
    const privateKey = await provider.value?.request({
      method: "solanaPrivateKey",
      params: [],
    });
    if (!privateKey) {
      throw new Error("Failed to retrieve private key from provider");
    }
    return privateKey as string;
  };

  // Initialize Web3Auth
  const init = async () => {
    try {
      const privateKeyProvider = new SolanaPrivateKeyProvider({
        config: { chainConfig },
      });

      const web3AuthOptions: Web3AuthNoModalOptions = {
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        privateKeyProvider,
        chainConfig,
      };

      const web3authInstance = new Web3AuthNoModal(web3AuthOptions);
      const redirectUrl = `${window.location.origin}/web3auth-callback`;
      const authAdapter = new AuthAdapter({
        privateKeyProvider,
        adapterSettings: {
          redirectUrl,
          uxMode: UX_MODE.REDIRECT,
        },
      });

      web3authInstance.configureAdapter(authAdapter);
      await web3authInstance.init();

      web3Auth.value = web3authInstance;
    } catch (e) {
      error.value = "Failed to initialize Web3Auth";
      console.error(e);
    }
  };

  const loginWithWeb3Auth = async (loginProvider?: string) => {
    if (!web3Auth.value) {
      await init();
    }

    try {
      // Ensure Web3Auth is initialized and connected
      if (web3Auth.value?.status !== "ready") {
        throw new Error("Failed to connect");
      }

      if (loginProvider) {
        console.log("Connecting with provider:", loginProvider);
        await web3Auth.value.connectTo(WALLET_ADAPTERS.AUTH, {
          loginProvider,
        });
      }

      const privateKey = await web3Auth.value.provider?.request({
        method: "solanaPrivateKey",
      });

      setProvider(privateKey as string);

      userInfo.value = await web3Auth.value?.getUserInfo().then((user) => ({
        username: user.name || "Web3Auth User",
        profileImage:
          user.profileImage ||
          "https://avatars.dicebear.com/api/identicon/default.svg",
      }));

      isAuthenticated.value = true;

      localStorage.setItem("authMethod", "web3auth");
    } catch (e) {
      error.value = "Web3Auth login failed";
      console.error(e);
    }
  };

  // Login with private key
  const loginWithPrivateKey = async (privateKey: string) => {
    try {
      // Create wallet from private key
      setProvider(privateKey);

      userInfo.value = {
        username: "Anonymous Worker",
        profileImage: "/img/avatar.jpg",
      };

      isAuthenticated.value = true;

      localStorage.setItem("authMethod", "privateKey");
      localStorage.setItem("userInfo", JSON.stringify(userInfo.value));
      localStorage.setItem("privateKey", privateKey);
    } catch (e) {
      error.value = "Private key login failed";
      console.error(e);
    }
  };

  // Logout
  const logout = async () => {
    if (web3Auth.value) {
      await web3Auth.value.logout();
    }

    provider.value = null;

    userInfo.value = null;
    isAuthenticated.value = false;

    localStorage.removeItem("authMethod");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("privateKey");
  };

  // Check existing session on app load
  const checkSession = async () => {
    const authMethod = localStorage.getItem("authMethod");

    if (authMethod === "web3auth") {
      await init();
      if (web3Auth.value?.status === "connected") {
        const pk = await web3Auth.value.provider?.request({
          method: "solanaPrivateKey",
        });

        if (!pk) {
          error.value = "Failed to retrieve private key from Web3Auth";
          return;
        }

        userInfo.value = await web3Auth.value?.getUserInfo().then((user) => ({
          username: user.name || "Web3Auth User",
          profileImage:
            user.profileImage ||
            "https://avatars.dicebear.com/api/identicon/default.svg",
        }));

        privateKey.value = pk as string;

        isAuthenticated.value = true;
      }
    } else if (authMethod === "privateKey") {
      const savedUserInfo = localStorage.getItem("userInfo");
      if (savedUserInfo) {
        userInfo.value = JSON.parse(savedUserInfo);
        isAuthenticated.value = true;
        const pk = localStorage.getItem("privateKey");
        if (pk) {
          privateKey.value = pk;
        } else {
          error.value = "Private key not found in localStorage";
        }
      }
    }

    // Auth side-effects; initialize worker & setup provider
    if (isAuthenticated.value && privateKey.value) {
      await setProvider(privateKey.value);
      const { initialize } = useWorkerStore();
      if (privateKey.value) {
        try {
          const privateKeyBytes = Buffer.from(privateKey.value, "hex").slice(
            0,
            32,
          );

          await initialize(privateKeyBytes);
        } catch (e) {
          error.value = "Failed to initialize worker with private key";
          console.error(e);
        }
      }
    }
  };

  return {
    init,
    loginWithWeb3Auth,
    loginWithPrivateKey,
    logout,
    checkSession,
    requestPrivateKey,
    provider,
    userInfo,
    isAuthenticated,
    error,
    web3Auth,
    privateKey,
    account,
  };
};
