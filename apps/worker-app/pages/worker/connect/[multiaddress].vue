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
    <NodeStatusCard class="my-5" />
    <ClaimPaymentsModal v-model="isOpenClaimModal" />
    <TaskModal />
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
      <StatisticCard
        icon="i-lucide-cpu"
        label="Time Online"
        :value="formattedUptime"
      >
        <small class="text-xs font-mono text-emerald-500"
          >payout every
          {{ Number.parseInt(config.public.PAYOUT_INTERVAL) / 1000 / 60 }}
          minutes</small
        >
      </StatisticCard>
      <StatisticCard
        icon="i-lucide-dollar-sign"
        label="Total Earned"
        :value="`${totalEffectEarnings} EFFECT`"
      >
      </StatisticCard>
      <StatisticCard
        icon="i-lucide-activity"
        label="Tasks Completed"
        :value="totalTasksCompleted"
      />
      <StatisticCard
        icon="i-material-symbols-score-sharp"
        label="Performance"
        :value="`${performanceScore}%`"
      >
      </StatisticCard>
    </div>
    <TaskList class="my-5" />
  </div>
</template>

<script lang="ts" setup>
  import { multiaddr } from "@effectai/protocol-core";
  import { tryOnBeforeUnmount } from "@vueuse/core";
  import { fromString, toString } from "uint8arrays";

  definePageMeta({
    middleware: ["auth"],
  });

  const {
    connectToManagerMutation,
    isActive,
    uptimeSeconds,
    disconnectFromManagerMutation,
  } = useSession();
  const { mutateAsync: connect } = connectToManagerMutation;
  const { mutateAsync: disconnect } = disconnectFromManagerMutation;

  const connectHandler = async (accessCode?: string) => {
    try {
      await connect({
        multiAddress: decodedMultiAddr.value.toString(),
        accessCode: accessCode ? accessCode : undefined,
      });

      toast.add({
        title: "Connected to Manager Node",
        description: "Successfully connected to manager node",
        color: "success",
      });

      promptAccessCode.value = false;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Access code is required")) {
          promptAccessCode.value = true;
        }
      } else {
        console.error("Unexpected error:", error);
        toast.add({
          title: "Connection Error",
          description: "An unexpected error occurred while connecting.",
          color: "error",
        });
        return;
      }
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
    await disconnect();
  });
</script>
