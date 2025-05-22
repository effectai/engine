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

export const useWeb3Auth = () => {
  const clientId =
    "BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

  const privateKey = useLocalStorage<string | null>("privateKey", null);
  const isConnected = ref(false);

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

  const useGetUserInfo = () => {
    const authStore = useAuthStore();
    const { account } = storeToRefs(authStore);

    return useQuery({
      queryKey: ["userInfo", account],
      queryFn: async () => {
        if (!web3auth.value) throw new Error("Web3Auth not initialized");
        const userInfo = await web3auth.value.getUserInfo();
        return userInfo as UserInfo;
      },
      enabled: computed(() => !!web3auth.value),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  const init = async () => {
    web3auth.value = new Web3AuthNoModal(web3AuthOptions);
    web3auth.value.configureAdapter(authAdapter);

    web3auth.value.once("connected", async ({ provider, adapter }) => {
      isConnected.value = true;

      privateKey.value = await provider.request({
        method: "solanaPrivateKey",
      });
    });

    await web3auth.value.init();
  };

  const useLogout = (opts: MutationOptions<void, unknown> = {}) =>
    useMutation({
      ...opts,
      mutationFn: async () => {
        if (!web3auth.value) throw new Error("Web3Auth not initialized");
        if (!web3auth.value.connected) return;
        await web3auth.value.logout();
      },
      onSuccess: (...args) => {
        opts.onSuccess?.(...args);
      },
    });

  return {
    web3auth,
    privateKeyProvider,
    chainConfig,
    useGetUserInfo,
    init,
    useLogout,
  };
};
