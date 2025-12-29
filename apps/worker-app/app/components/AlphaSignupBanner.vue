<template>
  <UCard
    class="mb-4 border-primary bg-primary/5"
    variant="outline"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/40"
        >
          <UIcon
            name="i-heroicons-beaker"
            class="h-5 w-5 text-grey"
          />
        </div>

        <div>
          <h2 class="text-base font-semibold">
            Alpha Testing for Workers
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
            Join the alpha and help shape the future of worker tasks, 
            with early access to new task types and evolving ways to earn.
          </p>
        </div>
      </div>

      <UButton
        class="text-black"
        icon="i-heroicons-arrow-top-right-on-square"
        :to="'https://forms.gle/ovZXKQBvemXVn5Gy5'"
        target="_blank"
      >
        Apply for Alpha
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
</script>
