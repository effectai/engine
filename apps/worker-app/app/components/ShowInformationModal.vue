<template>
  <UModal
    v-model:open="data"
    :ui="{
      width: 'w-full sm:max-w-[42em]', // Set the full modal width here
    }"
  >
    <template #content>
      <UCard
        :ui="{
          base: 'relative overflow-hidden',
          ring: '',
          divide: 'divide-y divide-gray-200 dark:divide-gray-700',
          body: {
            base: 'space-y-4',
          },
        }"
      >
        <template #header>
          <div class="flex flex-col space-y-1.5">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              Task Instructions
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Read and follow the instructions bellow carefully
            </p>
          </div>
        </template>

        <template #default>
          <div v-html="instructions"></div>
        </template>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              @click="closeModal"
              color="error"
              variant="solid"
              size="md"
              class="font-medium"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";

const props = defineProps<{
  modelValue: boolean;
  instructions: string;
}>();

const closeModal = () => {
  data.value = false;
};

const emit = defineEmits(["update:modelValue"]);
const data = useVModel(props, "modelValue", emit);
</script>

<style lang="scss" scoped></style>
