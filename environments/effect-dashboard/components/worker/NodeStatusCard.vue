<template>
  <UCard class="">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">NODE STATUS</h2>
      <div v-if="isCopied">Copied!</div>
      <div class="flex gap-2">
        <UButton
          color="black"
          class=""
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
          @click="copyToClipboard(workerPeerId!)"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-cpu" size="16" />
            NODE ADDRESS
          </div>
          <code class="text-emerald-400" v-if="workerPeerId">{{
            sliceBoth(workerPeerId)
          }}</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded clipable"
          @click="copyToClipboard(managerPeerId!)"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-link" size="16" />
            MANAGER NODE
          </div>

          <code class="text-emerald-400" v-if="managerPeerId">{{
            sliceBoth(managerPeerId)
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
          <code class="text-emerald-400">{{ latency }} ms</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-parking-meter" size="16" />
            NONCE
          </div>
          <code class="text-emerald-400" v-if="nonces">{{
            nonces.nextNonce
          }}</code>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from "vue";
const sessionStore = useSessionStore();
const { managerPeerId } = storeToRefs(sessionStore);
const { useGetNonce } = sessionStore.useActiveSession();

const workerStore = useWorkerStore();
const { workerPeerId } = storeToRefs(workerStore);

const { data: nonces } = useGetNonce();
// const { data: latency } = usePing();

const { useDisconnect } = useSession();
const isCopied = ref(false);

const disconnect = async () => {
  await useDisconnect().mutateAsync();
  navigateTo("/worker/connect");
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 1500);
}
</script>

<style scoped>
  .clipable:hover {
    opacity: 0.7;
    cursor: pointer;
  }
</style>
