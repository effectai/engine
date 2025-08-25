import { defineNuxtPlugin } from "#app";
import { initWalletStore } from "./core/state";

export default defineNuxtPlugin((nuxtApp) => {
  const store = initWalletStore(nuxtApp.vueApp);
  nuxtApp.provide("walletStore", store);
});
