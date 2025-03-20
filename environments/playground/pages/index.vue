<template>
  <div class="">
    <div class="my-5">
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
            { key: 'taskId', label: 'ID' },
            { key: 'created', label: 'Created at' },
            { key: 'status', label: 'Status' },
            { key: 'reward', label: 'Reward' },
            { key: 'actions', label: 'Actions' },
          ]"
        >
          <template #taskId-data="{ row }">
            <nuxt-link class="underline" :to="`/task/${row.taskId}`">{{
              row.taskId
            }}</nuxt-link>
          </template>
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

          <template #reward-data="{ row }"> {{ row.reward }} EFFECT </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { node, taskStore } = await useWorkerNode();

definePageMeta({
	layout: "worker",
	middleware: "auth",
});

const isOpen = ref(false);

const router = useRouter();
const actions = (row) => [
	[
		{
			label: "View",
			icon: "i-heroicons-eye-20-solid",
			click: () => {
				router.push(`/task/${row.taskId}`);
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
