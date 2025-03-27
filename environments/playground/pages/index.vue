<template>
  <div class="w-full">
    <div class="my-5" v-if="isPairing">
      <UCard class="bg-zinc-800 text-white">
        <p class="my-5 text-2xl">Pairing with Manager node...</p>
        <UProgress />

        <UButton @click="disconnect">Disconnect</UButton>
      </UCard>
    </div>
    <div v-else>
      <NodeStatusCard class="my-5" />
      <TaskModal v-model="activeTask" :active-task="activeTask" />

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
        <StatisticCard
          icon="i-lucide-cpu"
          label="Time Online"
          :value="uptime.formattedTime"
        >
          <small class="text-xs text-emerald-500 font-mono italic"
            >payout every
            {{ Number.parseInt(config.public.PAYOUT_INTERVAL) / 1000 / 60 }}
            minutes</small
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
          icon="i-lucide-baggage-claim"
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
  </div>
</template>

<script setup lang="ts">
import type { Payment, Task } from "@effectai/protocol";
import { peerIdFromString } from "@libp2p/peer-id";
import { useMutation } from "@tanstack/vue-query";
import { useIntervalFn } from "@vueuse/core";
import { useWallet } from "solana-wallets-vue";
const {
	connectionTime,
	taskStore,
	connected,
	isPairing,
	managerPeerId,
	workerPublicKey,
	managerPublicKey,
	node,
	reconnect,
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

const config = useRuntimeConfig();
const uptime = useUptime(connectionTime);
const claimInterval = useIntervalFn(
	() => {
		if (!managerPeerId.value) {
			console.warn("Manager Peer ID not found");
			return;
		}

		console.log("requesting payout..");
		requestPayout(managerPeerId.value);
	},
	Number.parseInt(config.public.PAYOUT_INTERVAL),
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

const { logout } = useAuth();
const { disconnect: disconnectWallet } = useWallet();
const router = useRouter();
const disconnect = () => {
	logout();
	disconnectWallet();
	router.push("/login");
};

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
		console.log("resuming..");
		claimInterval.resume();
	}
});

definePageMeta({
	middleware: "auth",
});

const { resume } = useIntervalFn(
	async () => {
		if (!node.value || !managerPeerId.value) return;
		const peerId = peerIdFromString(managerPeerId.value);
		const result = await node.value.services.ping.ping(peerId);
		console.log("Ping result", result);
	},
	10000,
	{ immediate: false },
);
//while connected, ping the manager node every 10 seconds to measure the latency
watchEffect(() => {
	if (!connected.value) return;
	resume();
});
</script>

<style lang="scss" scoped></style>
