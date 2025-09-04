import { computed, type Ref } from "vue";
import { useNuxtApp } from "#app";
import { useKitTransactionSendingSigner } from "../composables/useTransactionSendingSigner";
import type { TransactionSendingSigner } from "@solana/kit";

export function useWallet() {
  const { $walletStore: store } = useNuxtApp();

  const selectedName = computed(() => store.state.selectedName);
  const account = computed(() => store.state.account);
  const address = computed(() => store.state.account?.address ?? null);
  const connected = computed(() => !!store.state.account);
  const connecting = computed(() => store.state.connecting);
  const chains = computed(() => account.value.chain);
  const features = computed(() => account.value.features);
  const connection = computed(() => store.state.connection);
  const clientReady = computed(() => store.state.clientReady);
  const serverMode = computed(() => store.state.serverMode === true);

  const signer: Ref<TransactionSendingSigner | null> = computed(() => {
    if (!account.value || !store.wallet.value) return null;

    return useKitTransactionSendingSigner({
      wallet: store.wallet.value,
      account: store.state.account,

      //TODO:: allow chain override?
      chain: "solana:mainnet",
    });
  });

  const connect = (name: string) => store.connect(name);
  const disconnect = () => store.disconnect();

  const autoConnect = async () => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem("sol:wallet:last");
    if (last)
      try {
        await store.autoConnect(last);
      } catch {}
  };

  const formatAddress = (len = 4) =>
    address.value
      ? `${address.value.slice(0, len)}…${address.value.slice(-len)}`
      : "";

  const onWalletEvent = (event: any, handler: any) => {
    store.bus.on(event, handler);
    return () => store.bus.off(event, handler);
  };

  return {
    wallets: store.wallets,
    wallet: store.wallet,
    signer,
    selectedName,
    account,
    address,
    connected,
    chains,
    features,
    connection,
    clientReady,
    connecting,
    serverMode,
    connect,
    disconnect,
    autoConnect,
    formatAddress,
    onWalletEvent,
  };
}
