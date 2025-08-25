// composables/useWalletStandard.ts
import { ref } from "vue";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { getWallets } from "@wallet-standard/app";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionInput,
  type SolanaSignAndSendTransactionFeature,
} from "@solana/wallet-standard-features";

export function useWalletStandard() {
  const wallets = ref<Wallet[]>([]);
  const connectedWallet = ref<Wallet | null>(null);
  const accounts = ref<WalletAccount[]>([]);
  const selectedAccount = ref<WalletAccount | null>(null);

  const refresh = () => {
    wallets.value = getWallets().get();
  };

  const connect = async (wallet: Wallet) => {
    console.log("Connecting to wallet:", wallet.name);
    // Standard connect flow
    const connectFeature = wallet.features["standard:connect"];
    if (!connectFeature)
      throw new Error("Wallet does not support standard:connect");

    const result = await connectFeature.connect(); // may open wallet UI

    console.log("Connected to wallet:", wallet.name, result);

    connectedWallet.value = wallet;
    accounts.value = result.accounts;
    selectedAccount.value = accounts.value[0] ?? null;
  };

  const disconnect = async () => {
    const wallet = connectedWallet.value;
    if (!wallet) return;
    const disconnectFeature = wallet.features["standard:disconnect"];
    if (disconnectFeature) await disconnectFeature.disconnect();
    connectedWallet.value = null;
    accounts.value = [];
    selectedAccount.value = null;
  };

  refresh();

  return {
    wallets,
    connectedWallet,
    accounts,
    selectedAccount,
    refresh,
    connect,
    disconnect,
  };
}
