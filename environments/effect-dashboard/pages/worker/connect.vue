<template>
  <UCard
    class="p-6"
    :ui="{
      base: 'relative overflow-hidden',
      ring: '',
      divide: 'divide-y divide-gray-200 dark:divide-gray-700',
      body: {
        padding: 'px-0 py-0 sm:p-0',
      },
    }"
  >
    <!-- Header Section -->
    <template #header>
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Connect to a Manager Node
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Select a manager node from the available options below
        </p>
      </div>
    </template>

    <div v-if="isFetching" class="p-6 text-center">
      <div class="flex justify-center items-center space-x-2 text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span>Discovering Manager Nodes...</span>
      </div>
    </div>

    <div v-else-if="isError" class="p-6">
      {{ isError }}
      {{ error }}
      <UAlert
        icon="i-heroicons-exclamation-circle"
        color="red"
        variant="subtle"
        title="Connection Error"
        description="Unable to fetch manager nodes. Please try again later."
      />
    </div>

    <div v-else-if="managers && managers.length === 0" class="p-6 text-center">
      <UAlert
        icon="i-heroicons-information-circle"
        color="blue"
        variant="subtle"
        title="No Nodes Available"
        description="There are currently no manager nodes available."
      />
    </div>

    <!-- Content Section -->
    <div v-else class="space-y-4 p-6">
      <!-- Access Code Step -->
      <div v-if="stepAccessCode" class="space-y-4">
        <UAlert
          icon="i-heroicons-lock-closed"
          color="primary"
          variant="subtle"
          title="Access Required"
          description="This manager requires an access code to connect."
          class="mb-4"
        />

        <UFormGroup label="Access Code" class="space-y-2">
          <UInput
            v-model="accessCode"
            placeholder="Enter access code"
            size="md"
            autofocus
          />
        </UFormGroup>

        <div class="flex justify-end pt-2">
          <UButton
            color="gray"
            variant="solid"
            :disabled="!selectedManager"
            @click="connectHandler"
            :loading="isPending"
            class="font-medium"
          >
            Connect
          </UButton>
        </div>
      </div>

      <!-- Node Selection Step -->
      <div v-else class="space-y-3">
        <div
          v-for="(manager, index) in managers"
          :key="index"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <URadio
            v-model="selectedManager"
            :value="manager"
            class="w-full"
            :ui="{ color: 'primary' }"
          >
            <template #label>
              <div
                class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 font-mono text-sm"
              >
                <!-- Node Number -->
                <div
                  class="flex items-center gap-1 text-gray-500 dark:text-gray-400"
                >
                  <span>#{{ index + 1 }}</span>
                </div>

                <!-- Host -->
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-heroicons-server"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span class="text-gray-900 dark:text-gray-200">
                    {{ extractHost(manager.announcedAddresses[0]) }}
                  </span>
                </div>

                <!-- Peer ID -->
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-heroicons-finger-print"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300">
                    {{ sliceBoth(manager.peerId) }}
                  </span>
                </div>

                <!-- Latency -->
                <div class="flex items-center gap-1">
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span class="text-gray-700 dark:text-gray-300">
                    {{ manager.latency }}ms
                  </span>
                </div>

                <!-- Version -->
                <div class="flex items-center gap-1">
                  <UBadge leading-icon="i-heroicons-tag" color="gray" size="xs"
                    >alpha v{{ manager.version }}
                  </UBadge>
                </div>
              </div>
            </template>
          </URadio>
        </div>

        <div class="flex justify-end pt-4">
          <UButton
            color="gray"
            variant="solid"
            :disabled="!selectedManager || !nextNonce"
            @click="attemptConnection"
            :loading="isPending || isFetchingNonce"
            class="font-medium"
          >
            Continue
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { multiaddr, type Multiaddr } from "@effectai/protocol";

definePageMeta({
  layout: "worker",
  middleware: ["auth"],
});

const { data: managers, isFetching, isError, error } = useFetchManagerNodes();
const selectedManager = ref<ManagerInfoResponse | null>(null);
const accessCode = ref<string | null>(null);
const stepAccessCode = ref(false);

const { account } = useWeb3Auth();
const { useConnect } = useSessionStore();
const { mutateAsync: connect, isPending } = useConnect();
const selectedManagerPublicKey = computed(() => {
  return selectedManager.value?.publicKey.toString();
});

const selectedManagerPeerId = computed(() => {
  return selectedManager.value?.peerId.toString();
});

const { data: nextNonce, isFetching: isFetchingNonce } = useNextNonce(
  selectedManagerPublicKey,
  selectedManagerPeerId,
);

const toast = useToast();
const connectHandler = async () => {
  if (selectedManager.value) {
    const selected = multiaddr(selectedManager.value.announcedAddresses[0]);

    if (!account.value) {
      console.error("No account found");
      return;
    }

    if (!nextNonce.value) {
      console.error("No next nonce found");
      return;
    }

    try {
      await connect({
        account: account.value,
        managerPeerId: selectedManager.value.peerId,
        managerMultiAddress: selected.toString(),
        managerPublicKey: selectedManager.value.publicKey,
        nextNonce: nextNonce.value.nextNonce,
        accessCode: accessCode.value ?? undefined,
      });

      navigateTo("/worker");
    } catch (e) {
      console.error("Error connecting to manager: ", e);
      toast.add({
        color: "red",
        title: "Connection Error",
        description: e.message,
      });
    }
  }
};

const extractHost = (multiaddr: string) => {
  const parts = multiaddr.split("/");
  return parts[2];
};

const attemptConnection = () => {
  if (selectedManager.value.requiresAccessCode) {
    stepAccessCode.value = true;
  } else {
    connectHandler();
  }
};
</script>

<style scoped></style>
