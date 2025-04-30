<template>
  <UCard class="p-6 space-y-6">
    <h1 class="text-2xl font-bold my-5">Connect to a Manager Node</h1>
    <p class="text-gray-500 mb-3">
      Please select a manager node to connect to. You can choose any of the
      available nodes.
    </p>

    <div v-if="isFetching" class="text-gray-500">Fetching manager nodes...</div>

    <div v-else-if="isError" class="text-red-500">
      <p>Unable to fetch manager nodes. Please try again later.</p>
    </div>

    <div
      v-else-if="filteredManagers && filteredManagers.length === 0"
      class="text-gray-500"
    >
      <p class="font-bold">No manager nodes available right now.</p>
    </div>

    <div v-else class="space-y-3">
      <div v-if="stepAccessCode">
        <div>
          This manager requires an access code to connect. Please enter the code
          <UInput v-model="accessCode" />

          <UButton
            color="black"
            class="mt-4"
            :disabled="!selectedManager"
            @click="connectHandler"
            :loading="isPending"
          >
            Connect
          </UButton>
        </div>
      </div>

      <div v-else>
        <div
          v-for="(manager, index) in managers"
          :key="index"
          class="p-4 my-3 rounded-md border hover:bg-gray-50 transition cursor-pointer"
        >
          <URadio
            v-if="manager"
            v-model="selectedManager"
            :value="manager"
            class="w-full"
            :ui="{ color: 'black' }"
          >
            <template #label>
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:gap-3 font-mono text-sm"
              >
                <div class="flex items-center gap-1">
                  <span class="text-gray-400">{{ index + 1 }}:</span>
                  <span>{{ extractHost(manager.announcedAddresses[0]) }}</span>
                </div>
                <div class="hidden sm:block text-gray-300">|</div>
                <div class="flex items-center gap-1">
                  <span>{{ sliceBoth(manager.peerId) }}</span>
                </div>
                <div class="hidden sm:block text-gray-300">|</div>
                <div class="flex items-center gap-1">
                  <span>Version:</span>
                  <span>{{ manager.version }}</span>
                </div>
                <div class="hidden sm:block text-gray-300">|</div>
                <div class="flex items-center gap-1">
                  <span>Latency:</span>
                  <span>{{ manager.latency }}ms</span>
                </div>
              </div>
            </template>
          </URadio>
        </div>
        <UButton
          color="black"
          class="mt-5"
          :disabled="!selectedManager || !nextNonce"
          @click="stepAccessCode = true"
          :loading="isPending"
        >
          Connect
        </UButton>
      </div>
    </div>
    <div class="pt-4"></div>
  </UCard>
</template>

<script setup lang="ts">
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { ManagerInfoResponse } from "@effectai/protocol";

definePageMeta({
  layout: "worker",
  middleware: ["auth"],
});

const { data: managers, isFetching, isError } = useFetchManagerNodes();
const filteredManagers = computed(() => managers.value?.filter((m) => m));
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

const { data: nextNonce } = useNextNonce(
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
        managerMultiAddress: selected.toString(),
        managerPublicKey: selectedManager.value.publicKey,
        nextNonce: nextNonce.value.nextNonce,
        accessCode: accessCode.value ?? undefined,
      });

      navigateTo("/worker");
    } catch (e) {
      console.error("Error connecting to worker: ", e);
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
</script>

<style scoped></style>
