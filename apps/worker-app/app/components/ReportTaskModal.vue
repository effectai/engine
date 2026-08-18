<template>
  <UModal v-model:open="data" class="w-full sm:max-w-lg">
    <template #content>
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex flex-col space-y-1">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              Report Task
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Let us know what went wrong so we can improve task quality.
            </p>
          </div>
        </template>

        <template #default>
          <div class="space-y-4 p-4">
            <UFormField label="Issue Type" required>
              <USelect
                v-model="issueType"
                :items="issueOptions"
                placeholder="Select an issue..."
                class="w-full"
              />
            </UFormField>

            <UFormField label="Additional Details">
              <UTextarea
                v-model="message"
                placeholder="Describe what happened (optional)..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" color="neutral" @click="closeModal">
              Cancel
            </UButton>
            <UButton
              color="error"
              :disabled="!issueType"
              @click="submitReport"
            >
              Submit Report
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
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: { task: "report"; issue_type: string; message: string }];
}>();

const data = useVModel(props, "modelValue", emit);

const issueOptions = [
  { label: "Can't Submit Task", value: "cant_submit" },
  { label: "Images/Videos Not Loading", value: "media_not_loading" },
  { label: "Task Content is Broken", value: "content_broken" },
  { label: "Instructions are Incorrect or Misleading", value: "bad_instructions" },
  { label: "Task Appears Empty", value: "task_empty" },
  { label: "Task is Taking Too Long to Load", value: "slow_loading" },
  { label: "Other", value: "other" },
];

const issueType = ref("");
const message = ref("");

watch(data, (open) => {
  if (open) {
    issueType.value = "";
    message.value = "";
  }
});

const closeModal = () => {
  data.value = false;
};

const submitReport = () => {
  if (!issueType.value) return;
  emit("submit", { task: "report", issue_type: issueType.value, message: message.value });
  closeModal();
};
</script>
