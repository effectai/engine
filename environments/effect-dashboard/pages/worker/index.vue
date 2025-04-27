<template>
  <WorkerNodeStatusCard class="my-5" />
  <WorkerTaskModal />
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
    <WorkerStatisticCard
      icon="i-lucide-cpu"
      label="Time Online"
      :value="uptime.formattedTime"
    >
      <small class="text-xs text-emerald-500 font-mono italic"
        >payout every
        {{ Number.parseInt(config.public.PAYOUT_INTERVAL) / 1000 / 60 }}
        minutes</small
      >
    </WorkerStatisticCard>
    <WorkerStatisticCard
      icon="i-lucide-dollar-sign"
      label="Total Earned"
      :value="totalEarned"
    />
    <WorkerStatisticCard
      icon="i-lucide-activity"
      label="Tasks Completed"
      :value="totalCompletedTasks"
    />
    <WorkerStatisticCard
      icon="i-material-symbols-score-sharp"
      label="Performance"
      :value="performanceScore"
    >
      <!-- <UButton @click="claimPaymentsHandler" class="btn btn-primary mt-2" color="white" :loading="isClaiming" -->
      <!--   :disabled="!connected"> -->
      <!--   Claim Payments -->
      <!-- </UButton> -->
    </WorkerStatisticCard>
  </div>
  <WorkerTaskList class="my-5" />
  <WorkerPaymentsList />
</template>

<script lang="ts" setup>
import { useWorkerStore } from "@/stores/worker";
import { multiaddr } from "@multiformats/multiaddr";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";

definePageMeta({
  middleware: ["web3-auth", "connected"],
});

const workerStore = useWorkerStore();
const { connect, initialize } = workerStore;
const { connectedOn } = storeToRefs(workerStore);
const config = useRuntimeConfig();

const useSetupWorkerNode = async () => {
  // Fetch private key from local storage
  const privateKey = useLocalStorage("privateKey", null);
  if (!privateKey.value) {
    throw new Error(
      "Private key not found in local storage. Please ensure it's set.",
    );
  }
  const privateKeyBytes = Buffer.from(privateKey.value, "hex").slice(0, 32);

  // Get manager node public key and multiaddress from the config
  const managerPublicKey = new PublicKey(
    config.public.EFFECT_MANAGER_SOLANA_PUBKEY,
  );
  const managerNodeMultiAddress = config.public.EFFECT_MANAGER_MULTIADDRESS;

  // Ensure the manager's peerId can be derived from the multiaddress
  const managerPeerId = multiaddr(managerNodeMultiAddress).getPeerId();
  if (!managerPeerId) {
    throw new Error(
      `Invalid manager node multiaddress: ${managerNodeMultiAddress}`,
    );
  }

  const { publicKey } = useWallet();
  if (!publicKey.value) {
    throw new Error(
      "Public key not found in wallet. Please ensure the wallet is connected.",
    );
  }

  try {
    await initialize(privateKeyBytes);
  } catch (error: any) {
    throw new Error(`Failed to initialize worker node: ${error.message}`);
  }

  try {
    const nonce = await useNextNonce(
      publicKey.value,
      managerPublicKey,
      managerPeerId.toString(),
    );
    await connect(managerNodeMultiAddress, nonce);
  } catch (error: any) {
    throw new Error(`Failed to connect to manager node: ${error.message}`);
  }

  return {
    managerPublicKey,
    privateKeyBytes,
  };
};

await useSetupWorkerNode();
const uptime = useUptime(connectedOn);

const { useGetPayments } = usePayments();
const { data: payments } = useGetPayments();

const { useGetTasks } = useTasks();
const { data: completedTasks } = useGetTasks(ref("completed"));
const { data: rejectedTasks } = useGetTasks(ref("rejected"));
const { data: expiredTasks } = useGetTasks(ref("expired"));

//performance score is amount of rejected/expired tasks versus amount completed.
const performanceScore = computed(() => {
  if (!completedTasks.value || !rejectedTasks.value || !expiredTasks.value) {
    return formatNumber(0);
  }

  const totalTasks =
    completedTasks.value.length +
    rejectedTasks.value.length +
    expiredTasks.value.length;

  if (totalTasks === 0) {
    return formatNumber(0);
  }

  const performance =
    (rejectedTasks.value.length + expiredTasks.value.length) / totalTasks;

  return `${(100 - formatNumber(performance * 100)).toFixed(2)} %`;
});

const totalEarned = computed(() => {
  if (!payments.value) {
    return formatNumber(0);
  }

  const total = payments.value.reduce((acc, payment) => {
    return acc + payment.state.amount;
  }, 0n);

  return `${formatBigIntToAmount(total)} EFFECT`;
});

const totalCompletedTasks = computed(() => {
  if (!completedTasks.value) {
    return formatNumber(0);
  }

  return completedTasks.value.length;
});

tryOnBeforeUnmount(async () => {
  await workerStore.disconnect();
});

const payoutInterval = Number.parseInt(config.public.PAYOUT_INTERVAL);
const interval = useIntervalFn(
  async () => {
    if (!workerStore.worker || !workerStore.managerPeerId) {
      return;
    }

    await workerStore.worker.requestPayout({
      managerPeerIdStr: workerStore.managerPeerId,
    });
  },
  payoutInterval,
  {
    immediate: false,
  },
);

watch(
  () => connectedOn.value,
  (newValue) => {
    if (newValue) {
      interval.resume();
    } else {
      interval.pause();
    }
  },
  { immediate: true },
);
</script>
