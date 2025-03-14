<template>
  <div class="">
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

      <div class="">
        <UTable
          :loading="taskStore === null"
          :rows="taskStore"
          :loading-state="{
            icon: 'i-heroicons-arrow-path-20-solid',
            label: 'Waiting for tasks...',
          }"
          :progress="{ color: 'primary', animation: 'carousel' }"
          class="w-full"
          :columns="[
            { key: 'id', label: 'ID' },
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
  </div>
</template>

<script setup lang="ts">
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
import { type Task } from "@effectai/protocol";

definePageMeta({
	layout: "worker",
	middleware: "auth",
});

const activeTask = ref<Task | null>(null);
const isOpen = ref(false);

const { node, taskStore, challengeStore } = await useWorkerNode();

const handleSubmit = async (e) => {
	e.preventDefault();

	if (!activeTask.value || !node.value) return;

	await node.value.services.worker.completeTask(
		activeTask.value.id,
		JSON.stringify({
			worker: node.value.peerId.toString(),
			result: "completed",
		}),
	);

	isOpen.value = false;
	activeTask.value = null;
};

const router = useRouter();
const actions = (row) => [
	[
		{
			label: "View",
			icon: "i-heroicons-eye-20-solid",
			click: () => {
				router.push(`/task/${row.id}`);
			},
		},
		{
			label: "Accept",
			icon: "i-heroicons-check-20-solid",
			click: async () => {
				// await node.value?.services.worker.acceptTask(row);
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
</script>

<style lang="scss" scoped>
  #template input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
  }
</style>
