<template>
  <section
    v-if="promptAccessCode"
    class="min-h-[80vh] flex items-center justify-center px-4 py-8"
  >
    <UCard
      class="w-full max-w-md shadow-xl"
      :ui="{
        base: 'backdrop-blur',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
        body: { base: 'space-y-5' },
      }"
    >
      <div class="flex items-center gap-3">
        <div
          class="h-10 w-10 rounded-2xl grid place-items-center bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          aria-hidden="true"
        >
          <!-- lock icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3M6.75 10.5h10.5A1.5 1.5 0 0118.75 12v6A1.5 1.5 0 0117.25 19.5H6.75A1.5 1.5 0 015.25 18v-6a1.5 1.5 0 011.5-1.5z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold">Access code required</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
            During the alpha phase, this manager node needs a valid access code
            to connect.
          </p>
        </div>
      </div>

      <UFormGroup
        label="Access code"
        name="accessCode"
        help="Paste or type your code"
        class="flex my-5 gap-1"
      >
        <UInput
          v-model="accessCode"
          placeholder="••••-••••-••••"
          icon="i-heroicons-key"
          size="lg"
          class="w-full"
          @keydown.enter="connectHandler(accessCode)"
          autofocus
        />
        <UButton
          color="primary"
          size="lg"
          class="flex-1 text-black"
          :disabled="!accessCode?.trim()"
          :loading="connecting"
          @click="connectHandler(accessCode)"
        >
          Connect
        </UButton>
      </UFormGroup>
      <UAlert
        icon="i-heroicons-megaphone"
        color="neutral"
        variant="subtle"
        title="Don’t have an access code?"
        class="mt-2"
      >
        <template #description>
          Tag
          <a
            class="underline underline-offset-2"
            href="https://x.com/intent/tweet?text=@effectaix%20%2B%202%20friends%20%F0%9F%94%A5 for%20a%20chance%20to%20win%20an%20access%20code%21"
            target="_blank"
            rel="noopener noreferrer"
            >@effectaix</a
          >
          and two random friends on X and you’ll enter our weekly raffle for
          access codes.
        </template>
      </UAlert>
    </UCard>
  </section>
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

const connecting = ref(false);

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
