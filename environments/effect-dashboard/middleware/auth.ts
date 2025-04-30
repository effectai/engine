export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const sessionStore = useSessionStore();
  const { connectedOn } = storeToRefs(sessionStore);

  const { privateKey, init, web3auth, authState } = useWeb3Auth();

  if (!web3auth.value) {
    await init();
    return;
  }

  if (
    !privateKey.value &&
    !authState.isConnected &&
    to.path !== "/worker/login"
  ) {
    return navigateTo("/worker/login");
  }

  if (!connectedOn.value && to.path !== "/worker/connect") {
    return navigateTo("/worker/connect");
  }
});
