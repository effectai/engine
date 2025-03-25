import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to) => {
	if (process.server) return;

	const { isAuthenticated, loadPrivateKey, privateKey } = useAuth();
	loadPrivateKey();

	const { publicKey } = useWallet();

	if (!isAuthenticated.value && to.path !== "/login") {
		return navigateTo("/login");
	}

	if (isAuthenticated.value && !publicKey.value && to.path !== "/onboard") {
		return navigateTo("/onboard");
	}
});
