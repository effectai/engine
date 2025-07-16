<template>
  <div
    v-if="promptAccessCode"
    class="flex flex-col items-center justify-center h-screen"
  >
    <div
      class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h2 class="text-xl font-semibold mb-4">Access Code Required</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        This manager node requires an access code to connect.
      </p>
      <input
        v-model="accessCode"
        type="text"
        placeholder="Enter Access Code"
        class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded mb-4"
      />
      <UButton
        color="neutral"
        @click="connectHandler(accessCode)"
        class="cursor-pointer"
      >
        Connect
      </UButton>
    </div>
  </div>

  <div v-else-if="isActive">
    <WorkerNodeStatusCard class="my-5" />
    <WorkerClaimPaymentsModal v-model="isOpenClaimModal" />
    <WorkerTaskModal />
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
      <WorkerStatisticCard
        icon="i-lucide-cpu"
        label="Time Online"
        :value="formattedUptime"
      >
        <small class="text-xs font-mono text-emerald-500"
          >payout every
          {{ Number.parseInt(config.public.PAYOUT_INTERVAL) / 1000 / 60 }}
          minutes</small
        >
      </WorkerStatisticCard>
      <WorkerStatisticCard
        icon="i-lucide-dollar-sign"
        label="Total Earned"
        :value="totalEffectEarnings"
      >
        <a href="#" @click="isOpenClaimModal = true" class="underline"
          >claim payments</a
        >
      </WorkerStatisticCard>
      <WorkerStatisticCard
        icon="i-lucide-activity"
        label="Tasks Completed"
        :value="totalTasksCompleted"
      />
      <WorkerStatisticCard
        icon="i-material-symbols-score-sharp"
        label="Performance"
        :value="performanceScore"
      >
      </WorkerStatisticCard>
    </div>
    <WorkerTaskList class="my-5" />
  </div>
</template>

<script lang="ts" setup>
import { multiaddr } from "@effectai/protocol";
import { fromString, toString } from "uint8arrays";

definePageMeta({
  layout: "worker",
  middleware: ["auth"],
});

const { connectToManagerMutation, isActive, uptimeSeconds } = useSession();

const { mutateAsync: connect } = connectToManagerMutation;
const { useIdentifyQuery } = useIdentify();

const connectHandler = async (accessCode?: string) => {
  try {
    await connect({
      multiAddress: decodedMultiAddr.value.toString(),
      // accessCode: accessCode ? accessCode : undefined,
    });

    toast.add({
      title: "Connected to Manager Node",
      description: "Successfully connected to manager node",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to connect to manager node:", error);
    toast.add({
      title: "Connection Error",
      description: error.message,
      color: "error",
    });
    return;
  }
};

// Automatically try to connect to the manager node when the component is mounted
onBeforeMount(async () => {
  connectHandler();
});

const route = useRoute();
const toast = useToast();

const { totalEffectEarnings, totalTasksCompleted, performanceScore } =
  useWorkerNode();

const formattedUptime = computed(() => {
  const seconds = uptimeSeconds.value;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
});

const promptAccessCode = ref(false);
const accessCode = ref("");

const decodedMultiAddr = computed(() => {
  const encodedMultiAddress = route.params.multiaddress as string;
  const decodedBytes = fromString(encodedMultiAddress, "base64url");
  return multiaddr(decodedBytes);
});

const config = useRuntimeConfig();
const isOpenClaimModal = ref(false);
const { data: _payout } = usePayout();
// const { data: identify } = useIdentify(managerMultiaddr);

// watch(
//   () => identify.value?.isConnected,
//   (isConnected, oldValue) => {
//     if (isConnected === false && oldValue === true) {
//       navigateTo("/worker/connect");
//     }
//   },
//   { immediate: true },
// );
//
tryOnBeforeUnmount(async () => {
  //TODO:: disconnect session before unmount..
  // await disconnect();
});
</script>
