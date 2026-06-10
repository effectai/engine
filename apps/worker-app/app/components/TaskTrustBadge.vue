<template>
  <div class="trust-badge" :class="approved ? 'approved' : 'unapproved'">
    <span class="dot" />
    <span class="label">
      {{ approved ? "Team-approved template — safe" : "Not yet approved — be careful" }}
    </span>
    <span v-if="!approved" class="hint">
      This task uses a custom template that hasn't been reviewed by the Effect
      team. It runs in a locked-down sandbox; only proceed if you trust the source.
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Trust signal shown on a task before the worker accepts it, reflecting
 * whether the task's template was approved by the Effect team.
 *
 * `approved` is sourced from the template's approval flag (see the Requestor
 * API). Wiring it through the worker requires the `approved` field to travel
 * on the Template/Task payload — see `.claude/api-todo.md` Phase 5.
 */
defineProps<{
  approved: boolean;
}>();
</script>

<style scoped>
.trust-badge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.3;
}
.trust-badge.approved {
  background: color-mix(in srgb, #2ecc71 15%, transparent);
  color: #1e8449;
}
.trust-badge.unapproved {
  background: color-mix(in srgb, #e67e22 15%, transparent);
  color: #b9770e;
}
.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
}
.label {
  font-weight: 600;
}
.hint {
  flex-basis: 100%;
  font-weight: 400;
  opacity: 0.85;
}
</style>
