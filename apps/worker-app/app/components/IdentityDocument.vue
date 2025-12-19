<template>
  <UModal title="Identity Document" :ui="{ content: 'max-w-4xl' }">
    <UButton
      variant="link"
      icon="i-lucide-file"
      class="underline cursor-pointer"
      color="neutral"
      >Identity Document</UButton
    >

    <template #body
      ><div class="id-doc">
        <div class="head">
          <div class="meta flex flex-wrap gap-4">
            <span v-if="peerId"
              >Peer: <strong>{{ sliceBoth(peerId.toString()) }}</strong></span
            >
            <span
              >Updated: <strong>{{ updatedHuman }}</strong></span
            >
          </div>

          <JsonTree :data="doc" :level="1" />
          <div class="actions">
            <button class="btn" @click="copyJson" :disabled="copied">
              {{ copied ? "Copied!" : "Export" }}
            </button>
          </div>
        </div>

        <div class="grid"></div></div></template
  ></UModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import JsonTree from "vue-json-tree";
const { userCapabilities } = useCapabilities();

/** Minimal, extensible types */
export interface Payment {
  id: string;
  amount: number | string; // e.g. "12.5" or 12.5
  currency?: string; // "EFX", "SOL", etc.
  timestamp: string; // ISO date
  from?: string;
  to?: string;
  txId?: string;
  meta?: Record<string, unknown>;
}

export interface Task {
  id: string;
  title?: string;
  completedAt: string; // ISO date
  reward?: number | string;
  meta?: Record<string, unknown>;
}

export interface Capability {
  key: string; // e.g. "voice-input", "network-ready"
  label?: string; // user-facing label
  issuedAt?: string; // ISO date
  level?: string | number; // optional grading
  meta?: Record<string, unknown>;
}

const props = defineProps<{
  peerId?: string;
  updatedAt?: string; // defaults to now if omitted
  payments?: Payment[];
  tasksCompleted?: Task[];
  capabilities?: Capability[];
}>();

const collapsed = ref(false);
const copied = ref(false);

const updatedHuman = computed(() => {
  const d = props.updatedAt ? new Date(props.updatedAt) : new Date();
  return d.toLocaleString();
});

const doc = computed(() => ({
  peerId: props.peerId.toString() ?? null,
  updatedAt: props.updatedAt ?? new Date().toISOString(),
  tasksCompleted: props.tasksCompleted ?? [],
  capabilities: props.capabilities ?? userCapabilities.value ?? [],
}));

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(doc.value, null, 2));
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    // no-op
  }
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(doc.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fname = `identity-document${props.peerId ? "-" + props.peerId : ""}.json`;
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toggleSections() {
  collapsed.value = !collapsed.value;
}
function toggle(_key: "payments" | "tasks" | "capabilities") {
  // hook if you want per-section collapse later
}
</script>

<style scoped>
  .id-doc {
    max-width: 980px;
    margin: 0 auto;
    padding: 12px;
  }
  .head {
    display: grid;
    gap: 10px;
    margin-bottom: 10px;
  }
  .title {
    font-size: 1.25rem;
    font-weight: 800;
  }
  .meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    color: #475569;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn.subtle {
    color: #475569;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .panel {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 180px;
  }
  .panel header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    font-weight: 700;
    background: #f8fafc;
    cursor: default;
  }
  .panel .body {
    padding: 10px 12px;
    overflow: auto;
    max-height: 360px;
  }
  .panel.collapsed .body {
    max-height: 0;
    padding: 0 12px;
    overflow: hidden;
  }

  .code {
    margin: 0;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 12.5px;
    line-height: 1.5;
    color: #0f172a;
    white-space: pre;
    tab-size: 2;
  }

  .full-json {
    margin-top: 12px;
  }
  .full-json summary {
    cursor: pointer;
    font-weight: 700;
    margin-bottom: 8px;
  }
</style>
