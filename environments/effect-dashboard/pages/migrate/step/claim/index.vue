<template>
	<div class="text-center">
		<ClaimProgress class="my-5" />

		<UCard 
            :duration="600" class=" flex justify-center flex-col" v-if="canClaim">
			<template #header>
				<h2 class="title">Claim Tokens</h2>
			</template>

			<div id="confetti-container" class="max-w-[50px] mx-auto w-full h-1">
				<ConfettiExplosion v-if="txId" :particleCount="200" :force="0.3" />
			</div>

			<div class="mb-12" v-if="migrationAccount">
				<p class="text-center text-lg">We have found the following claims
					associated with your Public Key </p>
				<BlockchainAddress class="w-full justify-center text-lg" v-if="publicKeyString"
					:address="publicKeyString" />
			</div>

			<div>
				<div class="mt-5" v-if="canClaim">
					<div v-if="isLoading">Loading Claims..</div>
					<div v-else-if="isError">
						<div v-if="!migrationAccount">
							<UIcon class="text-5xl" name="lucide:frown" />
							<p class="text-center text-lg">No active claims found for your Public Key</p>

							<BlockchainAddress class="w-full justify-center text-lg" v-if="publicKeyString"
								:address="publicKeyString" />
						</div>
					</div>
					<div v-else-if="migrationAccount" class="flex flex-col md:flex-row w-full gap-5">
						<UCard class="md:w-1/2 flex-grow w-full">
							<h2 class="title capitalize">Your Migration Claim</h2>
							<label class="text-gray-600 block">Amount: {{ vaultBalance }}</label>

							<UButton :loading="isPending" color="black" :disabled="vaultBalance == 0" class="mt-5"
								@click="handleClaim()">
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
const { useClaim, useGetMigrationAccount } = useMigrationProgram();
const { data: migrationAccount, isLoading, isError } = useGetMigrationAccount();

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

const vaultBalance = computed(() => migrationAccount.value?.vaultBalance.value.uiAmount)

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