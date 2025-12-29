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
            class="h-5 w-5 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Become an Alpha Tester
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Want to become an Alpha Tester? Need an access code to connect? 
            Get your access to Alpha now!
          </p>
        </div>
      </div>

      <div class="flex-shrink-0">
        <UButton
          class="text-black whitespace-nowrap"
          icon="i-heroicons-arrow-top-right-on-square"
          :to="'https://forms.gle/ovZXKQBvemXVn5Gy5'"
          target="_blank"
        >
          Get Access
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
</script>
