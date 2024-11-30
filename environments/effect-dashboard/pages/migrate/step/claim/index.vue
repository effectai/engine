<template>
	<UCard class="text-center flex justify-center flex-col" v-if="canClaim">
		<div id="confetti-container" class="max-w-[50px] mx-auto w-full h-3">
			<ConfettiExplosion v-if="txId" :particleCount="200" :force="0.3" />
		</div>

		<h2 class="title">Your Claims</h2>
		<UDivider class="my-3" />

		<div class="mb-12" v-if="claims && claims.length">
			<p class="text-center text-lg mt-8">We have found the following claims
				associated with your Public Key </p>
			<BlockchainAddress class="w-full justify-center text-lg" v-if="publicKeyString"
				:address="publicKeyString" />
		</div>

		<div>
			<div class="mt-5" v-if="canClaim">
				<div v-if="isLoading">Loading Claims..</div>
				<div v-else-if="isError">
					<div v-if="!claims || claims.length == 0" class="my-5">
						<UIcon class="text-5xl" name="lucide:frown" />
						<p class="text-center text-lg">No active claims found for your Public Key</p>
						<BlockchainAddress class="w-full justify-center text-lg" v-if="publicKeyString"
							:address="publicKeyString" />
					</div>
				</div>
				<div v-else-if="claims" class="flex flex-col md:flex-row w-full gap-5">
					<UCard v-for="claim in claims" class="md:w-1/2 w-full">
						<h2 class="title capitalize">{{ claim.type }} Claim</h2>
						<label class="text-gray-600">Amount</label>
						<p>{{ claim.amount }} EFX</p>
						<UButton color="black" :disabled="claim.amount == 0" class="mt-5"
							@click="handleClaim({ claimAccount: claim.data })">
							Claim on Solana
						</UButton>
					</UCard>
				</div>
				<div v-if="!txId" class="flex gap-x-5 justify-center my-5 items-center mt-10">
					<nuxt-link class="underline cursor-pointer" @click="reset">Switch accounts</nuxt-link>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup lang="ts">
import ConfettiExplosion from "vue-confetti-explosion";
import { useMigrationProgram } from "~/composables/useMigrationProgram";

const { canClaim, clear } = useGlobalState()
const { useClaim, useGetClaims } = useMigrationProgram();
const { data: claims, isError, isLoading, isLoadingError } = useGetClaims();

const { useGetEfxBalanceQuery } = useSolanaWallet()
const { data: efxBalance } = useGetEfxBalanceQuery();

const toast = useToast();
const txId: Ref<string | null> = ref(null);
const { mutateAsync: handleClaim } = useClaim({
	options: {
		onSuccess: (transationId) => {
			txId.value = transationId;
			console.log("transationId", transationId);
			toast.add({
				title: "Success",
				description: "Successfully claimed your new Effect Tokens on Solana!",
			});
		}
	}
})

const router = useRouter();
onBeforeMount(() => {
	if (!canClaim.value) {
		router.push("/migrate/step/verify");
	}
});

const { disconnect: disconnectEos } = useEosWallet();
const { disconnect: disconnectBsc } = useBscWallet()

const reset = () => {
	disconnectEos();
	disconnectBsc();
	clear()
	router.push("/migrate/step/verify");
}
</script>

<style lang="scss" scoped></style>