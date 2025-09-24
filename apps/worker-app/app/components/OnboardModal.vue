<template>
  <div>
    <UModal
      title="Welcome To The Alpha"
      v-model:open="isOpen"
      :close="false"
      size="md"
      :dismissible="false"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="warning"
            icon="i-lucide-flask-conical"
            title="This is a testing Alpha"
            description="Features may be incomplete, unstable, or reset without notice."
          />

          <ul class="list-disc pl-5 space-y-2 text-sm leading-relaxed">
            <li>
              This is a <b>pre-release</b> build that may change, break, or be
              reset at any time.
            </li>
            <li>
              You are solely responsible for any on-chain actions and use of
              EFFECT tokens.
            </li>
            <li>
              <b>No restoration or compensation</b> will be provided for loss of
              tokens, balances, or progress caused by bugs, issues, or resets.
            </li>
            <li>
              Back up your wallet/keys. Make sure to settle & claim your funds
              as often as possible.
            </li>
          </ul>

          <UCheckbox
            v-model="accepted"
            required
            label="I understand and accept the Alpha terms above."
          />
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end gap-2">
          <UButton
            label="I Agree & Continue"
            :disabled="!accepted"
            icon="i-lucide-check"
            @click="agree(close)"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";

const accepted = ref(false);
const newUser = useLocalStorage("newUser", true);

const isOpen = computed({
  get: () => newUser.value,
  set: (val: boolean) => {
    newUser.value = val;
  },
});
const agree = (close: () => void) => {
  newUser.value = false;
  close();
};
</script>

<style scoped></style>
