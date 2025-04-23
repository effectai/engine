<template>
  <UCard>
    <h2 class="title text-2xl">Total Earned</h2>
    <span class="text-slate-400">Total EFFECT you've earned this session.</span>
    <div class="flex justify-center items-center my-4">
      <div class="text-3xl flex justify-center items-center gap-2">
        <img class="rounded-xl" src="public/effect-icon.png" />
        <span>{{ totalEffectEarned }} <span class="text-xl">EFFECT</span></span>
      </div>
    </div>
    <div>
      <UButton v-if="publicKey" @click="claimPayments" color="black"
        >Claim {{ formatBigIntToAmount(claimableAmount) }} EFFECT</UButton
      >
      <WalletMultiButton v-else />
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import { WalletMultiButton, useWallet } from "solana-wallets-vue";
  const { claim } = usePaymentProgram();
  const { mutateAsync: claimFromContract } = claim();
  const { claimablePayments, claimableAmount, claimedAmount, requestProof } =
    usePayments();

  const { managerPublicKey } = useWorkerNode();

  const { publicKey } = useWallet();

  const props = defineProps<{
    totalUptimeInSeconds: number;
  }>();

  const { mutateAsync: requestPaymentProof } = requestProof();
  const claimPayments = async () => {
    //request a proof for the claimable payments
    const proof = await requestPaymentProof({
      payments: claimablePayments.value,
    });

    if (!proof) {
      console.error("No proof found");
      return;
    }

    //claim the payments
    await claimFromContract({ proof });
  };

  const totalEffectEarned = computed(() => {
    return formatBigIntToAmount(claimedAmount.value + claimableAmount.value);
  });
</script>

<style scoped></style>
