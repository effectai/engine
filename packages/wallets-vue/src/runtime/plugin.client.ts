import { initWalletStore } from "./core/state";
import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import { discoverWallets } from "./../runtime/core/registry";

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("[solana-wallet-vue] Initializing Solana Wallet Vue plugin...");
  const cfg = useRuntimeConfig().public.solanaWallet;

  const store = initWalletStore(nuxtApp.vueApp);
  nuxtApp.provide("walletStore", store);

  const wallets = await discoverWallets();
  store.setWallets(wallets);

  if (cfg.autoConnect) {
    const last = localStorage.getItem("sol:wallet:last");
    if (last) {
      store.autoConnect(last).catch((err: any) => {
        console.warn("[solana-wallet-vue] autoConnect failed:", err);
      });
    }
  }
});
