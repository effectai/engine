<template>
	<nav aria-label="Progress">
		<ol role="list" class="space-y-4 md:flex md:space-x-8 md:space-y-0 ">
			<li v-for="(step, i) in steps" :key="step.name" class="md:flex-1">
				<nuxt-link 
					:to="step.href"
					@click.prevent="goToStep(step)"
					:class="{ 'border-black': step.completed, 'border-gray-200': !step.completed, 'opacity-40 !cursor-not-allowed': step.disabled }"
					class="cursor-pointer group flex flex-col border-l-4 py-2 pl-4  md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
					<span class="text-xs">{{ step.name }}</span>
				</nuxt-link>
			</li>
		</ol>
	</nav>
</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";

const useSteps = () => {
	const { publicKey } = useWallet();
	const { canClaim } = useGlobalState();

	const steps = ref([
		{
			name: "Select Solana Wallet",
			href: "/step/connect",
			completed: computed(() => !!publicKey.value),
		},
		{
			name: "Verify Ownership",
			href: "/step/verify",
			completed: computed(() => !!canClaim.value),
			disabled: computed(() => !publicKey.value),
		},
		{
			name: "Claim Tokens",
			href: "/step/claim",
			completed: false,
			disabled: computed(() => !canClaim.value),
		},
	]);

	const currentStep = 1;

	return {
		steps,
		currentStep,
	};
};

const { steps, currentStep } = useSteps();

const router = useRouter();

const goToStep = (step) => {
	console.log(step);
	if (step.disabled) return;
	router.push(step.href);
};

</script>

<style>
.router-link-active.router-link-exact-active {
	font-weight: bold !important;
}
</style>