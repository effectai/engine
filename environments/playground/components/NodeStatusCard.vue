<template>
  <UCard
    class="bg-zinc-800 p-4 font-mono bg-gradient-to-b from-zinc-800/80 to-zinc-900/50 backdrop-blur-lg"
  >
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-white">NODE STATUS</h2>
      <div class="flex gap-2">
        <UButton
          color="white"
          class="text-white"
          variant="outline"
          icon="i-lucide-link"
          @click="disconnect"
        >
          Disconnect
        </UButton>
        <UButton
          color="white"
          class="text-white"
          variant="outline"
          icon="i-lucide-key"
          @click="disconnect"
        >
          Export Private Key
        </UButton>
        <UButton
          color="white"
          class="text-white"
          variant="outline"
          icon="i-lucide-logs"
          @click="logs"
          >Logs</UButton
        >
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="space-y-2">
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-cpu" size="16" />
            NODE ADDRESS
          </div>
          <code class="text-emerald-400" v-if="workerPublicKey">{{
            trimAddress(workerPublicKey.toBase58())
          }}</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-link" size="16" />
            MANAGER NODE
          </div>
          <code class="text-emerald-400" v-if="managerPeerId">{{
            trimAddress(managerPeerId)
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
          <code class="text-emerald-400">45ms</code>
        </div>
        <div
          class="flex items-center justify-between p-2 border border-zinc-700 rounded"
        >
          <div class="flex items-center gap-2 text-zinc-400">
            <UIcon name="i-lucide-parking-meter" size="16" />
            NONCE
          </div>
          <code class="text-emerald-400">{{ currentNonce }}</code>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";

const { workerPublicKey, managerPeerId } = useWorkerNode();
const { currentNonce } = useNonce();

const props = defineProps({
	stats: Object,
	isConnected: Boolean,
});

const emit = defineEmits(["connect", "disconnect"]);
const { logout } = useAuth();
const { disconnect: disconnectWallet } = useWallet();
const router = useRouter();
const disconnect = () => {
	logout();
	disconnectWallet();
	router.push("/login");
};

const { remoteNonce } = useNonce();
const logs = () => {
	console.log(remoteNonce.value);
};
</script>

<style scoped></style>
