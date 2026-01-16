<template>
  <UCard
    class="mb-4 border-amber-500 bg-amber-500/5"
    variant="outline"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/40"
      >
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="h-5 w-5 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div class="space-y-2">
        <h2 class="text-base font-semibold">
          Alpha Release Notice
        </h2>

        <ul class="list-disc pl-5 space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <li>
            This is a <b>pre release</b> build that may change, break, or be reset at any time.
          </li>
          <li>
            You are solely responsible for any on chain actions and use of EFFECT tokens.
          </li>
          <li>
            <b>No restoration or compensation</b> will be provided for loss of tokens, balances, or progress caused by bugs, issues, or resets.
          </li>
          <li>
            Back up your wallet and keys. Settle and claim your funds as often as possible.
          </li>
          <li>
            Use <b>one device and one browser only</b>. Switching devices or browsers will reset your profile and progress to zero on the second device or browser.
          </li>
          <li>
            <b>Do not clear your browser cache or cookies</b>. Clearing them will permanently erase your profile and progress.
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
</script>
