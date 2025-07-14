export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, checkSession } = useAuth();

  await checkSession();

  if (to.path === "/login" && isAuthenticated.value) {
    return navigateTo("/");
  }

  if (to.path !== "/login" && !isAuthenticated.value) {
    return navigateTo("/login");
  }

  if (!isAuthenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
