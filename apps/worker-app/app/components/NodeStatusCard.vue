<template>
  <UCard class="">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">NODE STATUS</h2>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-link"
          @click="disconnect"
        >
          Disconnect
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="space-y-2">
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded clipable"
          @click="copyNodeAddress(peerId?.toString() || '')"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-cpu" size="16" />
            NODE ADDRESS
          </div>
          <code class="text-black" v-if="peerId">{{
            sliceBoth(peerId.toString())
          }}</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded clipable"
          @click="copyManagerAddress(managerInfo?.peerId?.toString() || '')"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-link" size="16" />
            MANAGER NODE
          </div>

          <code class="text-black" v-if="managerInfo">{{
            sliceBoth(managerInfo.peerId?.toString())
          }}</code>
        </div>
      </div>
      <div class="space-y-2">
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-activity" size="16" />
            NETWORK LATENCY
          </div>
          <code class="text-black">N/A</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-parking-meter" size="16" />
            NONCE
          </div>
          <code class="text-black" v-if="nonces">{{ nonces.nextNonce }}</code>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const { managerInfo } = useSession();
const { useGetNoncesQuery } = useNonce();
const managerPeerId = computed(() => managerInfo.value?.peerIdStr);
const managerPublicKey = computed(() => managerInfo.value.publicKeyStr);
const { data: nonces } = useGetNoncesQuery(managerPublicKey, managerPeerId);

const { peerId } = useWorkerNode();

const toast = useToast();

const { disconnectFromManagerMutation } = useSession();
const { mutateAsync: disconnectFromManager } = disconnectFromManagerMutation;
const disconnect = async () => {
  await disconnectFromManager();
  navigateTo("/");
};

function copyNodeAddress(text: string) {
  navigator.clipboard.writeText(text);
  toast.clear();
  toast.add({
    title: "Copied!",
    color: "success",
    description: "Node address copied to clipboard",
  });
}

function copyManagerAddress(text: string) {
  navigator.clipboard.writeText(text);
  toast.clear();
  toast.add({
    title: "Copied!",
    color: "success",
    description: "Manager address copied to clipboard",
  });
}
</script>

<style scoped>
  .clipable:hover {
    opacity: 0.7;
    cursor: pointer;
  }
</style>
