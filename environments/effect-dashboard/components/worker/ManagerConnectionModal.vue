<template>
  <div>
    <UModal
      title="Connect to Manager Node"
      :close="{
        color: 'neutral',
        variant: 'outline',
        class: 'rounded-full',
      }"
    >
      <WorkerPulseBorderButton class="w-full" label="Connect" />
      <template #body>
        <div v-if="isFetching" class="p-6 text-center">
          <div class="flex justify-center items-center space-x-2 text-gray-500">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            <span>Discovering Manager Nodes...</span>
          </div>
        </div>

        <div v-else-if="isError" class="p-6">
          <UAlert
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="subtle"
            title="Connection Error"
            description="Unable to fetch manager nodes. Please try again later."
          />
        </div>

        <div
          v-else-if="managers && managers.length === 0"
          class="p-6 text-center"
        >
          <UAlert
            icon="i-heroicons-information-circle"
            color="info"
            variant="subtle"
            title="No Nodes Available"
            description="There are currently no manager nodes available."
          />
        </div>

        <WorkerManagersListItem
          v-for="(manager, index) in managers"
          :key="index"
          :id="manager.id"
          :url="manager.url"
          :version="manager.version"
          :region="manager.region"
          :peer-id="manager.peerId"
          :announced-addresses="manager.announcedAddresses"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const data = useVModel(props, "modelValue", emit);

const { data: managers, isFetching, isError, error } = useFetchManagerNodes();
</script>

<style scoped></style>
