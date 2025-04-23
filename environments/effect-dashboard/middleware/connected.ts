import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to, from) => {
  const { publicKey } = useWallet();

  if (!publicKey.value) {
    console.log("User is not connected, redirecting to login");
    return navigateTo("/login");
  }
});
