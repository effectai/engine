import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to, from) => {
	// If the user is not logged in, redirect to the login page
	const { publicKey } = useWallet();
	if (to.path !== "/login" && !publicKey.value) {
		return navigateTo("/login");
	}
});
