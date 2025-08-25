<template>
  <div>
    wallets:
    <UWalletMultiButton />
    <button @click="doStake">stake</button>
  </div>
</template>

<script setup lang="ts">
const { useStake } = useStakingProgram();

const { mutateAsync: stake } = useStake();
const doStake = async () => {
  await stake({
    amount: 5,
  });
};
</script>

<style scoped></style>
