import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  CHAIN_NAMESPACES,
  UX_MODE,
  WEB3AUTH_NETWORK,
  type IProvider,
  type UserInfo,
  type Web3AuthNoModalOptions,
} from "@web3auth/base";
import { SOLANA_CHAIN_IDS } from "@web3auth/ws-embed";
import { AuthAdapter, type AuthUserInfo } from "@web3auth/auth-adapter";
import {
  useMutation,
  useQuery,
  type MutationOptions,
} from "@tanstack/vue-query";

const web3auth: Ref<Web3AuthNoModal | null> = shallowRef(null);
const account = ref<string | null>(null);
const authState = reactive({
  isConnected: false,
  isLoading: false,
  error: null as Error | null,
});

export const useWeb3Auth = () => {
  const solanaWallet = ref<SolanaWallet | null>(null);
  const privateKey = useLocalStorage<string | null>("privateKey", null);

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

  const bindEventListeners = () => {
    if (!web3auth.value) return;

    web3auth.value.on("connected", async () => {
      authState.isLoading = false;
      authState.isConnected = true;
      try {
        const wallet = new SolanaWallet(web3auth.value.provider);
        solanaWallet.value = wallet;

        try {
          const accounts = await wallet.requestAccounts();
          account.value = accounts[0];
        } catch (e) {
          console.error("Failed to request accounts", e);
        }

        privateKey.value = await web3auth.value.provider?.request({
          method: "solanaPrivateKey",
        });
      } catch (e) {
        authState.error = e as Error;
      }
    });

    web3auth.value.on("connecting", () => {
      authState.isLoading = true;
    });

    web3auth.value.on("disconnected", () => {
      authState.isConnected = false;
    });

    web3auth.value.on("errored", (error) => {
      authState.error = error;
      authState.isLoading = false;
    });
  };

  const initMutation = useMutation({
    mutationFn: async () => {
      if (!web3auth.value) throw new Error("Web3Auth not initialized");

      bindEventListeners();
      authState.isLoading = true;

      await web3auth.value.init();
    },
    onSuccess: () => {
      if (!web3auth.value) return;
      authState.isConnected = web3auth.value.status === "connected";
    },
    onError: (error: unknown) => {
      authState.error = error as Error;
    },
    onSettled: () => {
      authState.isLoading = false;
    },
  });

  const useGetUserInfo = () =>
    useQuery({
      queryKey: ["userInfo", account],
      queryFn: async () => {
        if (!web3auth.value) throw new Error("Web3Auth not initialized");
        const userInfo = await web3auth.value.getUserInfo();
        return userInfo as UserInfo;
      },
      enabled: computed(() => !!web3auth.value && !!authState.isConnected),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

  const init = async () => {
    web3auth.value = new Web3AuthNoModal(web3AuthOptions);
    if (!web3auth.value) throw new Error("Web3Auth not initialized");
    web3auth.value.configureAdapter(authAdapter);

    await initMutation.mutateAsync();
  };

  const useLogout = (opts: MutationOptions<void, unknown> = {}) =>
    useMutation({
      ...opts,
      mutationFn: async () => {
        if (!web3auth.value) throw new Error("Web3Auth not initialized");
        await web3auth.value.logout();
      },
      onSuccess: (...args) => {
        authState.isConnected = false;
        account.value = null;
        privateKey.value = null;

        opts.onSuccess?.(...args);
      },
      onError: (error: unknown) => {
        authState.error = error as Error;
      },
    });

  return {
    web3auth,
    privateKeyProvider,
    privateKey,
    solanaWallet,
    account,
    authState,
    useGetUserInfo,
    init,
    useLogout,
  };
};
