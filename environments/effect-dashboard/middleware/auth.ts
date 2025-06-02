export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const { isInitialized, isAuthenticated } = storeToRefs(authStore);

  if (!isInitialized.value) {
    await authStore.init();
  }

  if (!isAuthenticated.value && to.path !== "/login") {
    return navigateTo("/login?returnTo");
  }
});
