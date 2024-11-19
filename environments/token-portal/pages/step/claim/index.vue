<template>
	<div class="text-center flex justify-center flex-col" v-if="canClaim">
		<div id="confetti-container" class="max-w-[50px] mx-auto w-full h-3">
			<ConfettiExplosion v-if="txId" :particleCount="200" :force="0.3" />
		</div>

		<h2 class="title">Token Claim</h2>
		<p class="">You have succesfully verified ownership of your account.</p>
		<div>
			<div class="mt-5" v-if="canClaim">
				<div class="flex justify-center gap-x-10 gap-y-2 items-center">
					<div class="flex flex-col text-2xl my-5">
						<NumberAnimation v-if="vaultAccountBalance || vaultAccountBalance === 0" ref="vaultCounter"
							:to="0" :duration="7" :format="(value: number) => value.toFixed(0)"
							:from="vaultAccountBalance" :autoplay="false" easing="linear">
						</NumberAnimation>
						Vault Balance
					</div>
					<span class="text-3xl">
						->
					</span>
					<div class="flex flex-col text-2xl my-5">
						<NumberAnimation ref="efxBalanceCounter"
							v-if="efxBalance && (vaultAccountBalance || vaultAccountBalance === 0)"
							:to="efxBalance?.value" :duration="7"
							:format="(value: number) => value.toFixed(0)" :from="efxBalance?.value || 0"
							:autoplay="false" easing="linear">
						</NumberAnimation>
						Token Balance
					</div>
				</div>

				<div v-if="!txId" class="flex gap-x-5 justify-center my-5 items-center">
					<UButton color="black" :disabled="Boolean(!vaultAccountBalance)" @click="handleClaim">
						Claim on Solana
					</UButton>
					<nuxt-link class="underline cursor-pointer" @click="reset">Log out</nuxt-link>
				</div>
				<div class="mb-3 mt-10" v-if="txId">
					<p>Thank you for being a loyal supporter of Effect AI. We truly couldn’t have come
						this far without the incredible support of our community. Your dedication means the world to us,
						and we’re excited to have you with us for many more years to come.</p>
					<p>Let’s continue building together. See you on Solana!</p>

					<div class="flex justify-center mt-5">
						<nuxt-link class="underline cursor-pointer" @click="reset">Migrate another account</nuxt-link>
					</div>
				</div>
			</div>
		</div>


	</div>
</template>

<script setup lang="ts">
import ConfettiExplosion from "vue-confetti-explosion";
import NumberAnimation from "vue-number-animation";

const efxBalanceCounter = ref(null);
const vaultCounter = ref(null);
const startAnim = () => {
	if (!vaultCounter.value) return;
	vaultCounter.value.play();
	efxBalanceCounter.value.play();
}


const { canClaim, clear } = useGlobalState()

const { useClaim, useGetVaultAccountBalance } = useProgram();

const { data: vaultAccountBalance } = useGetVaultAccountBalance();

const { useGetEfxBalanceQuery } = useSolanaWallet()
const { data: efxBalance, refetch } = useGetEfxBalanceQuery();

const efxBalanceSnapshot: Ref<number | undefined> = ref(0);
const toast = useToast();
const txId: Ref<string | null> = ref(null);
const { mutateAsync: handleClaim } = useClaim({
	options: {
		onMutate: () => {
			efxBalanceSnapshot.value = efxBalance.value?.value || 0;
		},
		onSuccess: (transationId) => {
			console.log(transationId);
			txId.value = transationId;
			toast.add({
				title: "Success",
				description: "Successfully claimed your new Effect Tokens on Solana!",
			});

			// refresh balances every 1 second, if we notice the balances are updates, stop the interval and start the animation
			const interval = setInterval(async () => {
				refetch();
				if (efxBalance.value?.value !== efxBalanceSnapshot.value) {
					console.log(efxBalance.value?.value, efxBalanceSnapshot.value)
					clearInterval(interval);
					await nextTick();
					startAnim();
				}

			}, 1000);
		}
	}
})

const router = useRouter();
onBeforeMount(() => {
	if (!canClaim.value) {
		router.push("/step/verify");
	}
});

const { disconnect: disconnectEos } = useEosWallet();
const { disconnect: disconnectBsc } = useBscWallet()

const reset = () => {
	disconnectEos();
	disconnectBsc();
	clear()
	router.push("/step/verify");
}
</script>

<style lang="scss" scoped></style>