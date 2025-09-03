import {
  type App,
  inject,
  provide,
  reactive,
  readonly,
  shallowRef,
  markRaw,
  type InjectionKey,
} from "vue";
import mitt, { type Emitter } from "mitt";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  StandardConnect,
  type StandardConnectFeature,
} from "@wallet-standard/features";
import { type Address, address as toAddress } from "@solana/kit";
import { isWalletAdapterCompatibleStandardWallet } from "@solana/wallet-adapter-base";
import type { SolanaFeatures } from "@solana/wallet-standard-features";

export type WalletEvents = {
  connected: void;
  disconnected: void;
  connecting: void;
  "account-changed": string;
  "network-changed": string;
  error: Error;
};

export type UIWallet = {
  name: string;
  icon?: string;
  version?: string;
  wallet: Wallet;
};

type State = {
  clientReady: boolean;
  isServer: boolean;
  selectedName: string | null;
  chain: `solana:${string}`;
  account: WalletAccount | null;
  address: Address | null;
  features: Readonly<SolanaFeatures[]> | null;
  connecting: boolean;
};

export type ConnectResult = {
  wallet: Wallet;
  account: WalletAccount;
  address: Address;
};

export type WalletStore = {
  state: Readonly<State>;
  wallets: ReturnType<typeof shallowRef<UIWallet[]>>;
  wallet: ReturnType<typeof shallowRef<Wallet | null>>;
  setWallets: (ws: readonly Wallet[]) => void;
  connect: (
    name: string,
    opts?: { chain?: `solana:${string}` },
  ) => Promise<ConnectResult>;
  autoConnect: (name: string) => Promise<ConnectResult>;
  disconnect: () => void;
  bus: Emitter<WalletEvents>;
};

const key: InjectionKey<WalletStore> = Symbol("sol:wallet-store");

export function initWalletStore(app: App): WalletStore {
  const bus = mitt<WalletEvents>();

  const walletAdapters = shallowRef<UIWallet[]>([]);
  const currentWallet = shallowRef<Wallet | null>(null);

  const state = reactive<State>({
    clientReady: false,
    isServer: typeof window === "undefined",
    selectedName: null,
    chain: "solana:mainnet",
    account: null,
    address: null,
    features: null,
    connecting: false,
  });

  function setWallets(ws: readonly Wallet[]) {
    const wrapped: UIWallet[] = [];
    for (const w of ws.filter(isWalletAdapterCompatibleStandardWallet)) {
      wrapped.push({
        name: w.name,
        icon: w.icon,
        version: w.version,
        wallet: markRaw(w),
      });
    }
    walletAdapters.value = wrapped;
    state.clientReady = true;
  }

  async function connect(
    name: string,
    opts?: { chain?: `solana:${string}` },
  ): Promise<ConnectResult | undefined> {
    try {
      const rec = walletAdapters.value.find((w) => w.name === name);
      if (!rec) throw new Error(`Wallet not found: ${name}`);

      const connectFeature = rec.wallet.features[StandardConnect] as
        | StandardConnectFeature[typeof StandardConnect]
        | undefined;

      if (!connectFeature)
        throw new Error('Wallet does not support "standard:connect"');

      await connectFeature.connect();

      const acct =
        (opts?.chain
          ? rec.wallet.accounts.find((a) => a.chains?.includes(opts.chain))
          : rec.wallet.accounts[0]) ?? null;

      if (!acct) {
        throw new Error(
          opts?.chain
            ? `No account available that supports ${opts.chain}`
            : "Wallet connected but returned no accounts",
        );
      }

      const addr = toAddress(acct.address) as Address;

      state.selectedName = name;
      state.address = addr;
      state.account = markRaw(acct);
      currentWallet.value = markRaw(rec.wallet);

      localStorage.setItem("sol:wallet:last", name);
      bus.emit("connected");
      state.connecting = false;
      return { wallet: rec.wallet, account: acct, address: addr };
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      state.connecting = false;
    }
  }

  async function autoConnect(name: string) {
    return connect(name);
  }

  function disconnect() {
    state.selectedName = null;
    state.account = null;
    state.address = null;
    currentWallet.value = null;
    bus.emit("disconnected");
  }

  const api: WalletStore = {
    state: readonly(state),
    wallets: walletAdapters,
    wallet: currentWallet,
    setWallets,
    connect,
    autoConnect,
    disconnect,
    bus,
  };

  provide(key, api);
  return api;
}

export function useWalletStore(): WalletStore {
  const api = inject(key);
  if (!api)
    throw new Error(
      "[solana-wallet-vue] Wallet store not initialized (did you register the module?)",
    );
  return api;
}
