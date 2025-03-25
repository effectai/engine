<template>
  <div class="w-full">
    <NodeStatusCard class="my-5" />
    <TaskModal v-model="activeTask" :active-task="activeTask" />

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
      <StatisticCard
        icon="i-lucide-cpu"
        label="Time Online"
        :value="uptime.formattedTime"
      >
        <small class="text-xs text-emerald-500 font-mono italic"
          >payout every 5 minutes</small
        >
      </StatisticCard>
      <StatisticCard
        icon="i-lucide-dollar-sign"
        label="Total Earned"
        :value="totalEarned"
      />
      <StatisticCard
        icon="i-lucide-activity"
        label="Tasks Completed"
        :value="totalCompletedTasks"
      />
      <StatisticCard
        icon="i-lucide-shield"
        label="EFFECT Claimable"
        :value="claimableAmountFormatted"
      >
        <UButton
          @click="claimPaymentsHandler"
          class="btn btn-primary mt-2"
          color="white"
          :loading="isClaiming"
          :disabled="!connected"
        >
          Claim Payments
        </UButton>
      </StatisticCard>
    </div>
    <TaskList class="my-5" />
    <PaymentsList />
  </div>
</template>

<script setup lang="ts">
import type { Payment, Task } from "@effectai/protocol";
import { useMutation } from "@tanstack/vue-query";
import { useIntervalFn } from "@vueuse/core";
const {
	connectionTime,
	taskStore,
	connected,
	managerPeerId,
	workerPublicKey,
	managerPublicKey,
} = useWorkerNode();
const {
	claimableAmount,
	claimedAmount,
	claimablePayments,
	requestPayout,
	requestProof,
} = usePayments();

const { fetchNonces } = useNonce();
const { activeTask } = useTasks();

const totalCompletedTasks = computed(
	() => taskStore.value.filter((task) => task.status === "COMPLETED").length,
);

const claimableAmountFormatted = computed(() => {
	return `${formatBigIntToAmount(claimableAmount.value)} EFFECT`;
});

const totalEarned = computed(() => {
	return `${formatBigIntToAmount(
		claimableAmount.value + claimedAmount.value,
	)} EFFECT`;
});

const uptime = useUptime(connectionTime);
const claimInterval = useIntervalFn(
	() => {
		if (!managerPeerId.value) {
			console.warn("Manager Peer ID not found");
			return;
		}

		requestPayout(managerPeerId.value);
	},
	300000,
	{ immediate: false },
);

const toast = useToast();
const { claim } = usePaymentProgram();
const { mutateAsync: mutateRequestProof } = requestProof();
const { mutateAsync: mutateClaim } = claim();
const { mutateAsync: claimPayments, isPending: isClaiming } = useMutation({
	mutationFn: async ({ payments }: { payments: Payment[] }) => {
		const proof = await mutateRequestProof({ payments });

		if (!proof) {
			throw new Error("Proof not found");
		}

		const claimResult = await mutateClaim({ proof });
	},
});

const claimPaymentsHandler = async () => {
	try {
		await claimPayments({ payments: claimablePayments.value });

		//refetch remote nonce
		await fetchNonces(workerPublicKey.value, managerPublicKey.value);

		toast.add({
			title: "Claimed",
			description: "Your payments have been claimed",
		});
	} catch (e) {}
};

watch(connected, () => {
	if (connected.value) {
		claimInterval.resume();
	} else {
	}
});

definePageMeta({
	middleware: "auth",
});
</script>

<style lang="scss" scoped></style>
