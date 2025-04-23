import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to, from) => {
  const privateKey = useLocalStorage("privateKey", null);

  if (!privateKey.value) {
    console.log("User is not authenticated, redirecting to login");
    return navigateTo("/login");
  }
});
