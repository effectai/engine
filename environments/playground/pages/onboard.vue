<template>
  <UCard class="max-w-lg mt-5 p-6">
    <h2 class="text-2xl font-title">Welcome to the Effect Worker Dashboard</h2>

    <p class="mt-3">
      To receive payments for tasks completed on the network, you can either:
    </p>

    <ul class="list-disc pl-5 mt-2">
      <li>Use your own Solana wallet</li>
      <li>Use and import a worker node wallet if you don’t have one yet</li>
    </ul>

    <div class="flex items-center gap-3 mt-5">
      <WalletMultiButton />
      <a class="underline text-black">I dont have a wallet yet.</a>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { WalletMultiButton, useWallet } from "solana-wallets-vue";

const { publicKey } = useWallet();
const router = useRouter();

watchEffect(async () => {
	if (publicKey.value) {
		await nextTick();
		router.push("/");
	}
});
</script>

<style scoped></style>
