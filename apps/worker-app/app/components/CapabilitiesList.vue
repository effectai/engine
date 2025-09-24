<template>
  <UCard class="mb-4 overflow-hidden" variant="outline">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="mdi-lightbulb-on"
            class="text-gray-500 dark:text-gray-400 w-6 h-6"
          />
          <h2 class="text-lg font-semibold">My Capabilities</h2>
        </div>

        <div class="flex items-center gap-2">
          <!-- optional quick actions -->
          <UBadge color="neutral" variant="subtle" size="xs">
            {{ userCapabilities.length }} total
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-if="userCapabilities.length === 0"
      class="p-8 text-center text-gray-500 dark:text-gray-400"
    >
      <div
        class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-100 dark:bg-gray-800"
      >
        <UIcon name="i-heroicons-sparkles-20-solid" class="h-6 w-6" />
      </div>
      <p class="italic">You haven’t acquired any capabilities yet.</p>
      <div class="mt-3">
        <UButton
          color="neutral"
          icon="i-heroicons-plus-circle-20-solid"
          size="sm"
          >Discover capabilities</UButton
        >
      </div>
    </div>

    <!-- List -->
    <ul v-else class="divide-y divide-gray-200 dark:divide-gray-800">
      <li
        v-for="capability in userCapabilities"
        :key="capability.id"
        class="group relative"
      >
        <div
          class="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-900/40"
        >
          <!-- Icon bubble -->
          <div
            class="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <UIcon
              :name="capability.icon || 'i-heroicons-bolt-20-solid'"
              class="h-5 w-5 text-gray-700 dark:text-gray-200"
            />
          </div>

          <!-- Texts -->
          <div class="flex min-w-0 flex-1 flex-col">
            <div class="flex items-center gap-2">
              <span class="truncate font-semibold">{{ capability.name }}</span>

              <!-- Category pill -->
              <UBadge color="neutral" variant="subtle" size="xs">
                {{ capability.category || "general" }}
              </UBadge>

              <!-- Value chip (only if exists) -->
              <UBadge
                v-if="
                  capability.value !== undefined && capability.value !== null
                "
                color="neutral"
                size="xs"
                variant="solid"
                class="ml-1"
              >
                {{ capability.value }}
              </UBadge>
            </div>

            <div
              class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
            >
              <span class="inline-flex items-center gap-1">
                <UIcon
                  name="i-heroicons-check-badge-20-solid"
                  class="h-4 w-4"
                />
                Acquired
                <UTooltip :text="formatFullDate(capability.awardedAt)">
                  <span class="underline decoration-dotted underline-offset-2">
                    {{ formatRelative(capability.awardedAt) }}
                  </span>
                </UTooltip>
              </span>
              <UDivider orientation="vertical" class="!h-3" />
              <span class="line-clamp-1" v-if="capability.description">{{
                capability.description
              }}</span>
            </div>
          </div>

          <!-- Right actions (optional) -->
          <div
            class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </div>
      </li>
    </ul>
  </UCard>
</template>
<script setup lang="ts">
const { userCapabilities } = useCapabilities();

function categoryColor(cat?: string) {
  const key = (cat || "").toLowerCase();
  if (["voice", "audio", "speech"].includes(key)) return "emerald";
  if (["network", "bandwidth", "latency"].includes(key)) return "indigo";
  if (["security", "auth", "identity"].includes(key)) return "amber";
  if (["compute", "ai", "gpu"].includes(key)) return "violet";
  return "gray";
}

function formatFullDate(dateLike: string | number | Date) {
  const d = new Date(dateLike);
  return d.toLocaleString();
}

function formatRelative(dateLike: string | number | Date) {
  const d = new Date(dateLike).getTime();
  const now = Date.now();
  const diff = d - now;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const abs = Math.abs(diff);
  const minutes = Math.round(diff / (60 * 1000));
  const hours = Math.round(diff / (60 * 60 * 1000));
  const days = Math.round(diff / (24 * 60 * 60 * 1000));

  if (abs < 60 * 60 * 1000) return rtf.format(minutes, "minute");
  if (abs < 24 * 60 * 60 * 1000) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}
</script>

<style scoped></style>
