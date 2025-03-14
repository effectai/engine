<template>
  <div>
    <UCard>
      <h2 class="title text-2xl">Total Earned</h2>
      <span class="text-slate-400"
        >Total EFFECT you've earned this session.</span
      >
      <div class="flex justify-center items-center my-4">
        <div class="text-4xl flex justify-center items-center gap-2">
          <img src="public/effect-icon.png" />
          <span>{{ totalPayments }} EFFECT</span>
        </div>
      </div>

      <div class="flex justify-between gap-2 mt-3">
        <div>
          <div class="flex flex-col">
            <UButton color="black" v-if="claimableAmount" class="button mt-5"
              >Claim {{ claimableAmount }} EFFECT</UButton
            >
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { claimableAmount, paymentStore } = await useWorkerNode();
const totalPayments = computed(() =>
	paymentStore.value.reduce((acc, cur) => acc + cur.amount, 0),
);
</script>

<style scoped></style>
