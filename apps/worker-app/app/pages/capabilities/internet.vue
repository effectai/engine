<template>
  <div class="net-cap">
    <AwardCapability :capability="capability" v-if="showModal" />
    <h2 class="text-xl my-5">🌐 Network Capability Test</h2>

    <div class="card">
      <div class="row">
        <button class="btn primary" :disabled="running" @click="runTest">
          Run Test
        </button>
        <button class="btn" :disabled="!running" @click="cancel">Cancel</button>
        <div class="spacer" />
        <div class="meta" v-if="netInfo">
          <span class="pill">Type: {{ netInfo.effectiveType }}</span>
          <span class="pill">RTT: ~{{ netInfo.rtt }} ms</span>
          <span class="pill" v-if="netInfo.downlink"
            >Downlink: ~{{ netInfo.downlink }} Mbps</span
          >
        </div>
      </div>

      <div class="progress" v-if="running">
        <div class="bar" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="grid">
        <div class="stat">
          <div class="k">Latency (avg)</div>
          <div class="v">
            {{ result.latencyAvgMs ?? "—"
            }}<span v-if="result.latencyAvgMs"> ms</span>
          </div>
          <div class="s">Jitter: {{ result.jitterMs ?? "—" }} ms</div>
        </div>
        <div class="stat">
          <div class="k">Download</div>
          <div class="v">
            {{ result.downloadMbps ?? "—"
            }}<span v-if="result.downloadMbps"> Mbps</span>
          </div>
          <div class="s">Peak: {{ result.downloadPeakMbps ?? "—" }} Mbps</div>
        </div>
        <div class="stat">
          <div class="k">Upload</div>
          <div class="v">
            {{ result.uploadMbps ?? "—"
            }}<span v-if="result.uploadMbps"> Mbps</span>
          </div>
          <div class="s">Peak: {{ result.uploadPeakMbps ?? "—" }} Mbps</div>
        </div>
        <div class="stat verdict" v-if="verdict">
          <div class="k">Capability</div>
          <div class="badge" :class="verdict.tier">{{ verdict.label }}</div>
          <div class="s">{{ verdict.note }}</div>
        </div>
      </div>

      <UButton
        class="mt-5"
        @click="showModal = true"
        v-if="verdict"
        color="neutral"
      >
        Next
      </UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

/**
 * Defaults: Cloudflare speed endpoints (CORS-enabled)
 * - __down?bytes=... (GET)
 * - __up (POST body)
 */
const endpoint = ref("https://speed.cloudflare.com");
const downBytes = ref(50_000_000); // 8 MB
const upBytes = ref(65000); // 4 MB
const showModal = ref(false);

const { availableCapabilities } = useCapabilities();

const capability = availableCapabilities.find((c) =>
  c.id.startsWith("effectai/internet-speed"),
);

const running = ref(false);
const progress = ref(0);
const result = ref({
  latencyAvgMs: null,
  jitterMs: null,
  downloadMbps: null,
  downloadPeakMbps: null,
  uploadMbps: null,
  uploadPeakMbps: null,
});
let aborter = null;

// Network Information API (optional)
const netInfo = computed(() => {
  const c =
    navigator.connection ||
    navigator.webkitConnection ||
    navigator.mozConnection;
  return c
    ? { effectiveType: c.effectiveType, rtt: c.rtt, downlink: c.downlink }
    : null;
});

const debug = computed(() =>
  JSON.stringify(
    {
      endpoint: endpoint.value,
      downBytes: downBytes.value,
      upBytes: upBytes.value,
      result: result.value,
    },
    null,
    2,
  ),
);

function cancel() {
  if (aborter) aborter.abort();
  running.value = false;
  progress.value = 0;
}

async function runTest() {
  running.value = true;
  progress.value = 0;
  result.value = {
    latencyAvgMs: null,
    jitterMs: null,
    downloadMbps: null,
    downloadPeakMbps: null,
    uploadMbps: null,
    uploadPeakMbps: null,
  };
  aborter = new AbortController();
  try {
    // 1) Latency / jitter (multiple tiny pings, cache-busted)
    const { avg, jitter } = await pingMany(
      `${endpoint.value}/__down?bytes=32`,
      8,
      aborter.signal,
    );
    result.value.latencyAvgMs = round(avg, 1);
    result.value.jitterMs = round(jitter, 1);
    progress.value = 20;

    // 2) Download test (one large GET with streaming timing)
    const dl = await downloadTest(
      `${endpoint.value}/__down?bytes=${downBytes.value}`,
      aborter.signal,
    );
    result.value.downloadMbps = round(dl.mbps, 2);
    result.value.downloadPeakMbps = round(dl.peak, 2);
    progress.value = 60;

    // 3) Upload test (POST random blob)
    const ul = await uploadTest(
      `${endpoint.value}/__up`,
      upBytes.value,
      aborter.signal,
    );
    result.value.uploadMbps = round(ul.mbps, 2);
    result.value.uploadPeakMbps = round(ul.peak, 2);
    progress.value = 100;
  } catch (e) {
    console.warn(e);
  } finally {
    running.value = false;
    setTimeout(() => (progress.value = 0), 500);
  }
}

// ---------- helpers ----------
function round(n, d = 2) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : n;
}

async function pingOnce(url, signal) {
  const t0 = performance.now();
  const res = await fetch(url + `&cb=${Math.random()}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error("ping failed");
  const t1 = performance.now();
  return t1 - t0;
}

async function pingMany(url, N = 6, signal) {
  const times = [];
  for (let i = 0; i < N; i++) {
    const t = await pingOnce(url, signal).catch(() => null);
    if (t != null) times.push(t);
    await sleep(80); // small gap
    progress.value = Math.min(20, 3 + (i / N) * 15);
  }
  if (!times.length) throw new Error("no ping samples");
  // discard worst outlier
  times.sort((a, b) => a - b);
  const trimmed = times.slice(0, Math.max(1, times.length - 1));
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  // jitter: mean absolute deviation
  const jitter =
    trimmed.reduce((a, b) => a + Math.abs(b - avg), 0) / trimmed.length;
  return { avg, jitter };
}

async function downloadTest(url, signal) {
  const t0 = performance.now();
  const res = await fetch(url + `&cb=${Math.random()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok || !res.body) throw new Error("download failed");
  const reader = res.body.getReader();
  let received = 0;
  let lastT = t0;
  let lastR = 0;
  let peak = 0;
  for (;;) {
    const { done, value } = await reader.read();
    const now = performance.now();
    if (value) {
      received += value.byteLength;
      // instantaneous rate between ticks (Mbps)
      const dt = (now - lastT) / 1000;
      const dr = received - lastR;
      if (dt > 0) {
        const inst = (dr * 8) / (dt * 1e6);
        if (inst > peak) peak = inst;
      }
      lastT = now;
      lastR = received;
      progress.value = 20 + Math.min(35, (received / downBytes.value) * 35);
    }
    if (done) break;
  }
  const t1 = performance.now();
  const seconds = (t1 - t0) / 1000;
  const mbps = (received * 8) / (seconds * 1e6);
  return { mbps, peak };
}

async function uploadTest(url, bytes, signal) {
  try {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    const t0 = performance.now();

    const chunkSize = 256 * 1024;
    let sent = 0;
    let peak = 0;
    console.log(buf.length);
    for (let i = 0; i < buf.length; i += chunkSize) {
      const chunk = buf.subarray(i, Math.min(i + chunkSize, buf.length));
      const c0 = performance.now();
      console.log("Uploading chunk", chunk.length);
      const res = await fetch(url, {
        method: "POST",
        body: chunk,
        headers: { "Content-Type": "application/octet-stream" },
        signal,
      });
      if (!res.ok) throw new Error("upload failed");
      const c1 = performance.now();
      const dt = (c1 - c0) / 1000;
      const inst = (chunk.length * 8) / (dt * 1e6);
      if (inst > peak) peak = inst;
      sent += chunk.length;
      progress.value = 60 + Math.min(35, (sent / bytes) * 35);
      await sleep(5);
    }
    const t1 = performance.now();
    const seconds = (t1 - t0) / 1000;
    const mbps = (bytes * 8) / (seconds * 1e6);
    return { mbps, peak };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const verdict = computed(() => {
  const r = result.value;
  if (r.latencyAvgMs == null) return null;
  const L = r.latencyAvgMs,
    D = r.downloadMbps ?? 0,
    U = r.uploadMbps ?? 0;

  if (L < 40 && D > 50) {
    return {
      tier: "great",
      label: "Excellent",
      note: "Ready for HD calls / realtime AI.",
    };
  }
  if (L < 80 && D > 20) {
    return {
      tier: "good",
      label: "Good",
      note: "Suitable for most calls and tasks.",
    };
  }
  if (L < 150 && D > 5) {
    return {
      tier: "ok",
      label: "Basic",
      note: "OK for voice and light tasks.",
    };
  }
  return {
    tier: "poor",
    label: "Limited",
    note: "Connection may struggle with realtime features.",
  };
});
</script>

<style scoped>
  .net-cap {
    max-width: 860px;
    margin: 0 auto;
    padding: 12px;
  }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 10px 30px -16px rgba(0, 0, 0, 0.14);
  }
  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .col {
    flex: 1 1 280px;
    min-width: 240px;
  }
  .col.small {
    flex: 0 0 160px;
  }
  .label {
    font-size: 0.85rem;
    color: #475569;
    margin-bottom: 4px;
  }
  .input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }
  .hint {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 4px;
  }
  .btn {
    border: 1px solid #e5e7eb;
    padding: 10px 14px;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    font-weight: 600;
  }
  .btn.primary {
    border-color: #c7d2fe;
    background: linear-gradient(180deg, #fff, #f6f7ff);
  }
  .spacer {
    flex: 1;
  }
  .meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pill {
    padding: 0.25rem 0.5rem;
    background: #f1f5f9;
    border-radius: 999px;
    font-size: 0.8rem;
    color: #334155;
  }

  .progress {
    height: 8px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
    margin: 6px 0 10px;
  }
  .bar {
    height: 100%;
    background: #6366f1;
    transition: width 0.2s ease;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 8px;
  }
  .stat {
    border: 1px solid #eef2f7;
    border-radius: 12px;
    padding: 12px;
    background: #fafbff;
  }
  .k {
    font-size: 0.8rem;
    color: #64748b;
  }
  .v {
    font-size: 1.3rem;
    font-weight: 800;
    color: #111827;
  }
  .s {
    font-size: 0.85rem;
    color: #475569;
  }
  .verdict .badge {
    display: inline-block;
    margin-top: 4px;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-weight: 800;
  }
  .badge.great {
    background: #dcfce7;
    color: #166534;
  }
  .badge.good {
    background: #e0e7ff;
    color: #3730a3;
  }
  .badge.ok {
    background: #fef9c3;
    color: #854d0e;
  }
  .badge.poor {
    background: #fee2e2;
    color: #991b1b;
  }

  .details {
    margin-top: 10px;
  }
  pre {
    white-space: pre-wrap;
    font-size: 0.85rem;
  }
</style>
