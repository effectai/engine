<template>
    <div class="text-center" v-if="canClaim">
        <h2 class="title">Token Claim</h2>
        <p class="subtitle">You have succesfully verified ownership of your account.</p>

        <div class="mt-5">
            <UButton @click="claim">Claim on Solana</UButton>
        </div>
    </div>
</template>

<script setup>
const router = useRouter();
const { signature, message, publicKey, canClaim, claim: _claim } = useClaim();

const claim = async () => {
	const txId = await _claim({
		signature: signature.value,
		message: message.value,
		foreignPublicKey: publicKey.value,
	});
	console.log("Claimed", txId);
};

onBeforeMount(() => {
	if (!canClaim.value) {
		console.warn("No signature or message");
		router.push("/step/verify");
	}
});
</script>

<style lang="scss" scoped></style>