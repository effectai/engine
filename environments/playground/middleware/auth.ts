import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to, from) => {
	// If the user is not logged in, redirect to the login page
	const privateKey = localStorage.getItem("privateKey");

	if (to.path !== "/login" && privateKey === null) {
		console.log("redirecting to login", privateKey);
		return navigateTo("/login");
	}
});
