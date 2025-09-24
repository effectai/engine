<template>
  <div
    class="microphone-check container mx-auto p-4 max-w-md bg-white rounded shadow"
  >
    <AwardCapability :capability="capability" v-if="detected" />
    <h2 class="text-xl">🎙 Microphone Check</h2>

    <p v-if="!isTesting">
      Please read the following sentence aloud once you click **Start Test**:
    </p>
    <blockquote
      v-if="!isTesting"
      style="font-style: italic; margin: 0.5rem 0; color: #444"
    >
      "The quick brown fox jumps over the lazy dog."
    </blockquote>

    <div v-if="error" style="color: #b00020; margin: 0.5rem 0">{{ error }}</div>

    <div style="margin: 0.5rem 0">
      <button v-if="!isTesting" @click="startTest">Start Test</button>
      <button v-else @click="stopTest">Stop</button>
    </div>

    <div v-if="isTesting" style="margin-top: 0.5rem">
      <p><strong>Status:</strong> {{ status }}</p>
      <div
        style="
          height: 12px;
          background: #eee;
          border-radius: 6px;
          overflow: hidden;
        "
      >
        <div
          :style="{
            width: (vuMeter * 100).toFixed(0) + '%',
            height: '100%',
            background: '#4caf50',
          }"
        ></div>
      </div>
    </div>

    <div v-if="detected" style="margin-top: 0.5rem; color: #4caf50">
      Microphone is working and audio was detected!
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isTesting = ref(false);
const detected = ref(false);
const status = ref("Idle");
const error = ref("");
const vuMeter = ref(0);

let stream = null;
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let rafId = null;
let activityDetected = false;
let activityTimer = null;

async function startTest() {
  error.value = "";
  status.value = "Requesting microphone…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);

    isTesting.value = true;
    status.value = "Please read the sentence aloud…";

    // reset activity
    activityDetected = false;
    activityTimer = setTimeout(() => {
      if (!activityDetected) {
        error.value =
          "No audio detected. Please check your microphone and try again.";
        stopTest();
      }
    }, 5000); // 5 seconds to detect voice

    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      vuMeter.value = Math.max(rms, vuMeter.value * 0.85);

      // if RMS above threshold, mark as detected
      if (rms > 0.05) {
        activityDetected = true;
        status.value = "Audio detected. Thank you!";
        detected.value = true;
        clearTimeout(activityTimer);
      }

      rafId = requestAnimationFrame(tick);
    };
    tick();
  } catch (e) {
    error.value = "Microphone access failed: " + e.message;
  }
}

function stopTest() {
  isTesting.value = false;
  status.value = "Idle";
  if (rafId) cancelAnimationFrame(rafId);
  if (activityTimer) clearTimeout(activityTimer);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  if (audioCtx) audioCtx.close();
  stream = audioCtx = analyser = sourceNode = null;
}

const { availableCapabilities } = useCapabilities();

const capability = availableCapabilities.find((c) =>
  c.id.startsWith("effectai/microphone-access"),
);
</script>
