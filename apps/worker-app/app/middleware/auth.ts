export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, checkSession } = useAuth();

  await checkSession();
  const router = useRouter();

  if (to.path === "/login" && isAuthenticated.value) {
    return navigateTo("/");
  }

  if (to.path !== "/login" && !isAuthenticated.value) {
    console.log("not authenticated, redirecting to login");
    router.push(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!isAuthenticated.value && to.path !== "/login") {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
