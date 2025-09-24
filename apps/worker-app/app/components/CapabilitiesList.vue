<template>
  <UCard class="overflow-y-scroll mb-4" variant="outline">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="mdi-lightbulb-on"
          class="text-gray-500 dark:text-gray-400 w-6 h-6"
        />
        <h2 class="text-lg font-semibold">My Capabilities</h2>
      </div>
    </template>
    <div>
      <div
        v-if="userCapabilities.length === 0"
        class="p-4 text-center text-gray-500"
      >
        No capabilities added yet. Visit the marketplace to add more.
      </div>

      <ul>
        <li
          v-for="capability in userCapabilities"
          :key="capability.id"
          class="p-4 border-b border-gray-200"
        >
          <div class="flex items-center gap-2" v-if="capability">
            <UIcon
              v-if="capability.icon"
              :name="capability.icon"
              class="text-2xl"
            />
            <div class="flex flex-col text-sm">
              <span class="font-semibold">{{ capability.name }}</span>
              <div class="flex items-center gap-1">
                <span class="text-gray-500 text-sm">{{
                  capability.category
                }}</span>
                <div>{{ capability.value }}</div>
              </div>
            </div>
          </div>
          <div class="text-sm text-gray mt-2">
            <UBadge color="success" size="sm" class="mr-2">
              acquired on:
              {{ new Date(capability.awardedAt).toLocaleDateString() }}
            </UBadge>
          </div>
        </li>
      </ul>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const { userCapabilities } = useCapabilities();
console.log(userCapabilities);
</script>

<style scoped></style>
