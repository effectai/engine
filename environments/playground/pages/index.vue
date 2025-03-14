<template>
  <div class="">
    <div class="my-5">
      <div>
        <UModal v-if="activeChallenge" v-model="isOpen">
          <div class="p-4">
            You have an incoming challenge from

            <UButton type="submit" class="button mt-5" value="Submit">
              Submit
            </UButton>
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
import { Challenge, type Task } from "@effectai/protocol";
const { node, taskStore, challengeStore } = await useWorkerNode();

definePageMeta({
	layout: "worker",
	middleware: "auth",
});

node.value.services.worker.addEventListener(
	"challenge:received",
	async ({ detail }) => {
		console.log("Challenge received", detail);
		activeChallenge.value = detail;
		isOpen.value = true;
	},
);

const activeChallenge = ref<Challenge | null>(null);
const isOpen = ref(false);

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
