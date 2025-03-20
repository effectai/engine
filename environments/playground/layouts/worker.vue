<template>
  <div id="layout-container">
    <div id="layout-bg"></div>
    <UContainer>
      <div v-if="!connected">
        <UCard class="mt-5 max-w-md">
          <h2 class="text-lg font-bold">Connecting to the network</h2>
          <p class="my-5">
            Welcome to the Effect AI Protocol Worker Dashboard. Please wait a
            moment while we connect you to a manager node.
          </p>
          <UProgress :total-uptime-in-seconds="0" animation="carousel" />
        </UCard>
      </div>
      <div v-else-if="connecting">
        <UCard class="mt-5 max-w-md">
          <h2 class="text-lg font-bold">Connecting...</h2>
          <p class="my-5">Please wait while we connect you to the network.</p>
        </UCard>
      </div>
      <div class="" v-else>
        <div class="flex justify-between space-x-12 mt-5 items-center">
          <div class="my-5">
            <h1 class="text-4xl font-bold">Effect AI Protocol</h1>
            <h2 class="text-mono text-sm">Worker Node / Alpha v0.0.1</h2>
            <div class="text-sm flex gap-1 mt-2">
              <label class="font-bold">Status:</label>
              <span class="text-green-500">Connected</span>
            </div>
            <div class="text-sm flex gap-1">
              <label class="font-bold">Worker address:</label>
              <span class="text-black" v-if="nodePublicKey">{{
                trimAddress(nodePublicKey)
              }}</span>
            </div>
            <div class="text-sm flex gap-1">
              <label class="font-bold">Node:</label>
              <span class="text-black">{{ trimAddress(nodePublicKey) }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <UButton color="black" @click="disconnect" class="button mt-5"
                >Disconnect</UButton
              >
            </div>
          </div>

          <div>
            <div class="flex gap-5">
              <UptimeCard :total-uptime-in-seconds="0" />
              <ProgressCard :total-uptime-in-seconds="0" />
            </div>
          </div>
        </div>
        <UModals />
        <div class="mt-5"><slot /></div>
      </div>
    </UContainer>
  </div>
</template>

<script setup>
import { useWallet } from "solana-wallets-vue";

import { useLocalStorage } from "@vueuse/core";
const {
	node,
	publicKey: nodePublicKey,
	connected,
	claimablePayments,
} = await useWorkerNode();
const { publicKey } = useWallet();

const privateKey = useLocalStorage("privateKey", null);
watchEffect(() => {
	if (!privateKey) {
		navigateTo("/login");
	}
});

const disconnect = async () => {
	privateKey.value = null;
	navigateTo("/login");
};

node.value.services.worker.addEventListener(
	"challenge:received",
	async ({ detail }) => {
		console.log("Challenge received", detail);
	},
);

onBeforeUnmount(async () => {
	await node.value.stop();
});
</script>

<style lang="scss" scoped>
  #layout-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #layout-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("./../assets/img/hero-background.png") no-repeat center
      center fixed;
    background-size: cover;
    z-index: -1;
    filter: blur(2px);
    opacity: 0.9;
  }
</style>
