export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, checkSession } = useAuth();

  await checkSession();

  if (to.path === "/login" && isAuthenticated.value) {
    return navigateTo("/worker");
  }

  if (to.path !== "/login" && !isAuthenticated.value) {
    return navigateTo("/login");
  }

  if (!isAuthenticated.value && to.path !== "/login") {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
