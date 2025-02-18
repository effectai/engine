<template>
  <div v-if="!publicKey">
    <wallet-multi-button></wallet-multi-button>
  </div>
  <div v-else class="">
    <div class="flex justify-between space-x-12 mt-5 items-center">
      <div class="my-5">
        <h1 class="text-4xl font-bold">Effect AI Protocol</h1>
        <h2 class="text-mono text-sm text-xl">Worker Node / Alpha v0.0.1</h2>
        <div class="text-sm flex gap-1 mt-2">
          <label class="font-bold">Status:</label>
          <span class="text-green-500">Connected</span>
        </div>
        <div class="text-sm flex gap-1">
          <label class="font-bold">Wallet:</label>
          <span class="text-black">{{ publicKey }}</span>
        </div>
        <div class="text-sm flex gap-1">
          <label class="font-bold">Node:</label>
          <span class="text-black">{{ key.publicKey }}</span>
        </div>
        <div class="flex gap-2">
          <UButton color="black" @click="disconnect" class="button mt-5"
            >Disconnect</UButton
          >
          <UButton color="black" @click="disconnect" class="button mt-5"
            >Export private key</UButton
          >
        </div>
      </div>

      <UptimeCard
        :total-uptime-in-seconds="4500"
        :last-ping="1000"
        :total-manager-uptime-in-seconds="2300"
      />
    </div>
    <div class="my-5">
      <div>
        <UModal v-if="activeTask" v-model="isOpen">
          <div class="p-4">
            <form @submit.prevent="handleSubmit">
              <div
                id="template"
                class="prose"
                v-html="activeTask.template"
              ></div>

              <UButton type="submit" class="button mt-5" value="Submit">
                Submit
              </UButton>
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
          { key: 'manager', label: 'Managed by' },
          { key: 'created', label: 'Created' },
          { key: 'status', label: 'Status' },
          { key: 'reward', label: 'Reward' },
          { key: 'actions', label: 'Actions' },
        ]"
      >
        <template #created-data="{ row }">
          <span>{{ new Date(row.created).toLocaleString() }}</span>
        </template>
        <template #manager-data="{ row }">
          <span>{{ trimAddress(row.manager) }}</span>
        </template>
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
      JSON.stringify({ worker: worker.peerId.toString(), result: "completed" })
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
      {
        label: "Payout",
        disabled: true,
        icon: "i-heroicons-currency-dollar-20-solid",
        onClick: () => {
          console.log("complete", row);
        },
      },
    ],
  ];

  // get private key from localStorage or create it
  const seed = localStorage.getItem("seed") || generateSeed().toString("hex");
  localStorage.setItem("seed", seed);
  const key = await generateKeyPairFromSeed(
    "Ed25519",
    Buffer.from(seed, "hex")
  );
  const worker = await createWorkerNode(
    [
      "/ip4/127.0.0.1/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
    ],
    key
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

<style lang="scss" scoped>
  #template input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
  }
</style>
