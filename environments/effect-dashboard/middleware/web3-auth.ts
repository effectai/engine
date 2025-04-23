import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return;

  const { isAuthenticated, loadPrivateKey, privateKey } = useAuth();
  loadPrivateKey();

  if (!isAuthenticated.value && to.path !== "/login") {
    return navigateTo("/login");
  }
});
