<template>
	<div class="text-center">
		<ClaimProgress class="my-5" v-motion :initial="{ opacity: 0, scale: 0.7 }" :enter="{ opacity: 1, scale: 1 }"
            :delay="300" :duration="600" />

		<UCard v-motion :initial="{ opacity: 0, scale: 0.7 }" :enter="{ opacity: 1, scale: 1 }" :delay="0"
            :duration="600" class=" flex justify-center flex-col" v-if="canClaim">
			<template #header>
				<h2 class="title">Claim Tokens</h2>
			</template>

			<div id="confetti-container" class="max-w-[50px] mx-auto w-full h-1">
				<ConfettiExplosion v-if="txId" :particleCount="200" :force="0.3" />
			</div>

			<div class="mb-12" v-if="claims && claims.length">
				<p class="text-center text-lg">We have found the following claims
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
						<UCard v-for="claim in claims" class="md:w-1/2 flex-grow w-full">
							<h2 class="title capitalize">{{ claim.type }} Claim</h2>
							<label class="text-gray-600">Amount</label>
							<p>{{ claim.amount }} EFX</p>
							<div v-if="claim.account.account.claimType.stake">
								<label class="text-gray-600">Staked since</label>
								{{ new Date(claim.account.account.claimType.stake?.stakeStartTime.toNumber() * 1000).toLocaleDateString() }}
							</div>

							<UButton :loading="isPending" color="black" :disabled="claim.amount == 0" class="mt-5"
								@click="handleClaim({ claim })">
								Claim on Solana
							</UButton>
						</UCard>
					</div>
					<div class="flex gap-x-5 justify-center my-5 items-center mt-10">
						<nuxt-link class="underline cursor-pointer" @click="reset">Switch accounts</nuxt-link>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import ConfettiExplosion from "vue-confetti-explosion";
import { useMigrationProgram } from "~/composables/useMigrationProgram";

const { canClaim, clear } = useGlobalState()
const { useClaim, useGetClaimAccounts } = useMigrationProgram();
const { data: claims, isLoading, isError } = useGetClaimAccounts();

const toast = useToast();
const txId: Ref<string | null> = ref(null);
const queryClient = useQueryClient();
const { mutateAsync: handleClaim, isPending } = useClaim({
	options: {
		onSuccess: (transactionId) => {
			queryClient.invalidateQueries({
				predicate: (query) => {
					return query.queryKey.includes("claims");
				},
			});

			txId.value = transactionId;

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