<template>
  <div v-if="!publicKey">
    <wallet-multi-button></wallet-multi-button>
  </div>
  <div v-else>
    <div class="text-center my-5">
      <h1 class="text-2xl font-bold">Effect AI Protocol</h1>
      <h2 class="text-mono text-sm">Worker / Alpha v0.0.1</h2>
      <div class="text-sm flex gap-1 mt-2 justify-center">
        <label class="font-bold">Status</label>
        <span class="text-green-500">Connected</span>
      </div>
      <div class="text-sm flex gap-1 justify-center">
        <label class="font-bold">Wallet</label>
        <span class="text-black">{{ publicKey }}</span>
      </div>
      <div class="text-sm flex gap-1 justify-center">
        <label class="font-bold">Node</label>
        <span class="text-black">{{ key.publicKey }}</span>
      </div>
      <UButton @click="disconnect" class="button mt-5">Disconnect</UButton>
    </div>
    <div>
      <div>
        <UModal v-if="activeTask" v-model="isOpen">
          <div class="p-4">
            <form @submit.prevent="handleSubmit">
              <div v-html="activeTask.template"></div>
            </form>
          </div>
        </UModal>
      </div>

      <UTable
        :loading="taskStore === null"
        :rows="taskStore || []"
        :loading-state="{
          icon: 'i-heroicons-arrow-path-20-solid',
          label: 'Waiting for tasks...',
        }"
        :progress="{ color: 'primary', animation: 'carousel' }"
        class="w-full"
        :columns="[
          { key: 'id', label: 'ID' },
          { key: 'manager', label: 'Manager' },
          { key: 'status', label: 'Status' },
          { key: 'reward', label: 'Reward' },
          { key: 'created', label: 'Created At' },
          { key: 'actions', label: 'Actions' },
        ]"
      >
        <template #actions-data="{ row }">
          <UDropdown :items="actions(row)">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal-20-solid"
            />
          </UDropdown>
        </template>
      </UTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Task, createWorkerNode } from "@effectai/protocol";
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

const { publicKey, disconnect } = useWallet();
const taskStore: Ref<Task[] | null> = ref(null);
const activeTask = ref<Task | null>(null);
const isOpen = ref(false);

const handleSubmit = async (e) => {
	e.preventDefault();

	if (!activeTask.value) return;

	await worker.services.worker.completeTask(
		activeTask.value.id,
		JSON.stringify({ worker: worker.peerId.toString(), result: "completed" }),
	);

	isOpen.value = false;
	activeTask.value = null;
};

const actions = (row) => [
	[
		{
			label: "View",
			icon: "i-heroicons-eye-20-solid",
			click: () => {
				activeTask.value = row;
				isOpen.value = true;
			},
		},
		{
			label: "Accept",
			icon: "i-heroicons-check-20-solid",
			click: async () => {
				await worker.services.worker.acceptTask(row);
			},
		},
		{
			label: "Reject",
			disabled: true,
			icon: "i-heroicons-x-20-solid",
			onClick: () => {
				console.log("reject", row);
			},
		},
	],
];

// get private key from localStorage or create it
const seed = localStorage.getItem("seed") || generateSeed().toString("hex");
localStorage.setItem("seed", seed);
const key = await generateKeyPairFromSeed("Ed25519", Buffer.from(seed, "hex"));
const worker = await createWorkerNode(
	[
		"/ip4/127.0.0.1/tcp/39823/ws/p2p/12D3KooWEbPPJ1bEVu6cPo7duMYx52NmtKZd1fLw1bxCoQ53cvdq",
	],
	key,
);

worker.services.taskStore.addEventListener("task:stored", async () => {
	taskStore.value = await worker.services.taskStore.all();
	console.log("task stored", taskStore.value);
});

worker.services.task.addEventListener("task:received", ({ detail }) => {
	console.log("task received", detail);
});

onBeforeUnmount(async () => {
	console.log("stopping worker");
	await worker.stop();
});
</script>

<style lang="scss" scoped></style>
