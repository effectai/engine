<template>
  <UCard class="border-gray-800 dark:!bg-[#1C1A1F]" v-if="vestingSchedules && vestingSchedules.length > 0">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Active Unstakes</h3>
        <UBadge v-if="true" color="gray" variant="solid" class="text-xs">
          {{ vestingSchedules.length }} Active
        </UBadge>
      </div>
    </template>
    <div class="space-y-4">
      <VestingScheduleItem 
      v-for="(account, i) in vestingSchedules" 
      :key="account.publicKey.toBase58()" 
      :vesting-account="account">
      </VestingScheduleItem>
    </div>
  </UCard>
</template>

<script lang="ts" setup>

const { useGetVestingAccounts } = useVestingProgram()
const { data: vestingSchedules } = useGetVestingAccounts()

</script>

<style scoped></style>