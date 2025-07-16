<template>
  <UCard class="">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">NODE STATUS</h2>
      <div v-if="isCopied">Copied!</div>
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
          @click="copyToClipboard(peerId?.toString() || '')"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-cpu" size="16" />
            NODE ADDRESS
          </div>
          <code class="text-emerald-400" v-if="peerId">{{
            sliceBoth(peerId.toString())
          }}</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded clipable"
          @click="copyToClipboard(managerPeerId)"
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
import { useClipboard } from "@vueuse/core";
import { ref } from "vue";

const { managerPeerIdStr, managerPublicKeyStr } = useSession();
const { useGetNoncesQuery } = useNonce();
const { data: nonces } = useGetNoncesQuery(
  managerPublicKeyStr,
  managerPeerIdStr,
);

const { data: latency } = usePing();
const { peerId } = useWorkerNode();

const isCopied = ref(false);

const disconnect = async () => {
  navigateTo("/worker");
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 1500);
}

const { privateKey } = useAuth();
const { copy } = useClipboard();
const toast = useToast();
const copyPrivateKey = () => {
  copy(privateKey.value);
  toast.add({
    title: "Private Key Copied",
    description: "Your private key has been copied to the clipboard.",
  });
};
</script>

<style scoped>
  .clipable:hover {
    opacity: 0.7;
    cursor: pointer;
  }
</style>
