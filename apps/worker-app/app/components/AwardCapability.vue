<template>
  <UModal
    default-open="true"
    :dismissible="false"
    :ui="{
      content: 'p-0 bg-transparent min-w-4xl',
    }"
  >
    <template #content
      ><div class="award-wrap">
        <!-- Canvas for confetti -->
        <canvas ref="canvas" class="confetti"></canvas>

        <!-- Capability card -->
        <div
          class="card flex flex-col items-center text-center pulse"
          :class="{ claimed }"
          @animationend="onCardAnimEnd"
        >
          <div class="badge">
            <div class="icon">{{ icon }}</div>
          </div>

          <div class="meta">
            <div class="kicker">Capability Unlocked</div>
            <h3 class="title">{{ capability.name }}</h3>
            <p class="desc" v-if="description">{{ capability.description }}</p>

            <div class="actions mt-4">
              <button v-if="!claimed" class="btn primary" @click="claim">
                Claim capability
              </button>
              <button v-else class="btn subtle" @click="continueHandler">
                Continue
              </button>
            </div>
          </div>

          <!-- Shine sweep -->
          <div class="shine"></div>
          <!-- Glow ring -->
          <div class="ring"></div>
        </div>

        <!-- Floating bits (subtle ambient animation) -->
        <div class="bits">
          <span
            v-for="n in 12"
            :key="n"
            class="bit"
            :style="bitStyle(n)"
          ></span>
        </div>

        <!-- Success toast -->
        <transition name="toast">
          <div v-if="claimed && showToast" class="toast">
            <span class="check">✓</span>
            <span>{{ successText }}</span>
          </div>
        </transition>
      </div></template
    >
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

import type { Capability } from "~/constants/capabilities";

const props = defineProps({
  capability: Object as () => Capability,
  name: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "🛡" },
  successText: { type: String, default: "Capability granted!" },
  autoPlay: { type: Boolean, default: false }, // run animation on mount
});

const emit = defineEmits(["claimed", "continue"]);

const canvas = ref(null);
let ctx = null;
let raf = null;
const particles = [];
const claimed = ref(false);
const showToast = ref(false);

function burst(x, y, count = 120) {
  const colors = ["#8b5cf6", "#22c55e", "#eab308", "#f43f5e", "#06b6d4"];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 7;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      g: 0.18 + Math.random() * 0.12,
      life: 60 + Math.random() * 40,
      color: colors[(Math.random() * colors.length) | 0],
      size: 3 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }
}

function loop() {
  if (!ctx || !canvas.value) return;
  const { width, height } = canvas.value;
  ctx.clearRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === "rect") {
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (p.y > height + 50 || p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  raf = requestAnimationFrame(loop);
}

const router = useRouter();
const continueHandler = () => {
  router.push("/"); // Adjust the path as needed
};

async function claim() {
  if (claimed.value) return;

  // pop card animation class
  const el = document.querySelector(".card");
  if (el) {
    el.classList.remove("pulse");
    // force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("pulse");
  }

  // fire confetti bursts from card center
  await nextTick();
  const rect = el?.getBoundingClientRect?.();
  const can = canvas.value;
  if (rect && can) {
    const x = rect.left + rect.width / 2 - can.getBoundingClientRect().left;
    const y = rect.top + rect.height * 0.35 - can.getBoundingClientRect().top;
    burst(x, y, 160);
    // Stagger a couple of extra pops for flair
    setTimeout(() => burst(x - 80, y - 20, 90), 120);
    setTimeout(() => burst(x + 80, y - 20, 90), 220);
  }

  claimed.value = true;
  showToast.value = true;
  emit("claimed");
  await awardCapability();

  // hide toast after a moment
  setTimeout(() => (showToast.value = false), 2200);
}

const capabilities = useLocalStorage("user-capabilities", []);

const awardCapability = async () => {
  if (capabilities.value.includes(props.capability.id)) {
    return false;
  }

  capabilities.value.push({
    id: props.capability.id,
    awardedAt: new Date().toISOString(),
  });

  return true;
};

function onCardAnimEnd(e) {
  // no-op, but kept in case you want hooks on keyframe end
}

/**
 * Ambient floating bits style
 */
function bitStyle(n) {
  // spread around a circle
  const angle = (n / 12) * Math.PI * 2;
  const r = 110 + ((n * 13) % 40);
  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r;
  const dur = 6 + ((n * 7) % 5);
  const delay = (n * 0.23) % 3;
  return {
    "--x": `${x}px`,
    "--y": `${y}px`,
    animationDuration: `${dur}s`,
    animationDelay: `${delay}s`,
  };
}

/**
 * Canvas sizing
 */
function resize() {
  if (!canvas.value) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.value.width = canvas.value.clientWidth * dpr;
  canvas.value.height = canvas.value.clientHeight * dpr;
  ctx = canvas.value.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

onMounted(() => {
  resize();
  window.addEventListener("resize", resize);
  loop();
  if (props.autoPlay) {
    setTimeout(() => claim(), 350);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", resize);
});
</script>

<style scoped>
  .award-wrap {
    position: relative;
    display: grid;
    place-items: center;
    padding: 32px 16px;
    min-height: 360px;
    overflow: hidden;
    background: radial-gradient(
      1200px 600px at 50% -20%,
      #f5f7ff 10%,
      #ffffff 65%
    );
    border-radius: 16px;
    border: 1px solid #eef0f6;
  }

  /* Confetti canvas covers area */
  .confetti {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* Capability card */
  .card {
    position: relative;
    width: min(520px, 92vw);
    padding: 22px 20px 18px;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff, #fbfbff);
    border: 1px solid #e9ecf6;
    box-shadow:
      0 20px 40px -20px rgba(54, 74, 158, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transform: translateZ(0);
  }

  .card.pulse {
    animation: pop 480ms ease-out;
  }

  .card.claimed {
    border-color: #dfe7ff;
    box-shadow:
      0 24px 48px -22px rgba(87, 102, 228, 0.35),
      0 0 0 6px rgba(99, 102, 241, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .badge {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: 20px;
    margin: 4px 0 12px;
    background:
      radial-gradient(
        100px 80px at 30% 25%,
        rgba(255, 255, 255, 0.8),
        transparent 60%
      ),
      linear-gradient(135deg, #6366f1, #22c55e);
    box-shadow:
      0 10px 32px rgba(99, 102, 241, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    position: relative;
    overflow: hidden;
  }

  .badge::after {
    content: "";
    position: absolute;
    inset: -40%;
    background: conic-gradient(
      from 180deg,
      transparent,
      rgba(255, 255, 255, 0.5),
      transparent 60%
    );
    animation: spin 4.5s linear infinite;
  }

  .icon {
    position: relative;
    font-size: 32px;
    z-index: 1;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
  }

  .meta {
    text-align: center;
    padding: 2px 8px 0;
  }

  .kicker {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
  }

  .title {
    font-size: 22px;
    line-height: 1.2;
    margin: 0 0 6px;
    color: #111827;
  }

  .desc {
    font-size: 14px;
    color: #4b5563;
    margin: 0 0 14px;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .btn {
    appearance: none;
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
  }

  .btn.primary {
    border-color: #c7d2fe;
    background: linear-gradient(180deg, #ffffff, #f6f7ff);
    color: #1f2937;
    box-shadow: 0 8px 16px -10px rgba(99, 102, 241, 0.45);
  }
  .btn.primary:hover {
    transform: translateY(-1px);
  }
  .btn.primary:active {
    transform: translateY(0);
  }

  .btn.subtle {
    color: #475569;
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  /* Shine sweep */
  .shine {
    pointer-events: none;
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
  }
  .shine::before {
    content: "";
    position: absolute;
    inset: -20%;
    transform: translateX(-120%) skewX(-15deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.75),
      transparent
    );
    animation: sweep 2.4s ease-in-out infinite;
  }

  /* Glow ring */
  .ring {
    pointer-events: none;
    position: absolute;
    inset: -6px;
    border-radius: 24px;
    background: radial-gradient(
      420px 160px at 50% -20%,
      rgba(99, 102, 241, 0.25),
      transparent 60%
    );
    opacity: 0;
  }
  .card.claimed .ring {
    animation: glow 1200ms ease-out forwards;
  }

  /* Ambient floating bits */
  .bits {
    pointer-events: none;
    position: absolute;
    inset: 0;
  }
  .bit {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: #c7d2fe;
    transform: translate(calc(var(--x)), calc(var(--y)));
    opacity: 0.75;
    animation: floaty var(--dur, 6s) ease-in-out var(--delay, 0s) infinite
      alternate;
  }
  .bit:nth-child(3n) {
    background: #a7f3d0;
    border-radius: 50%;
  }
  .bit:nth-child(4n) {
    background: #fde68a;
  }

  /* Success toast */
  .toast {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: #fff;
    border-radius: 999px;
    padding: 10px 14px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
  }
  .toast .check {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #22c55e;
    color: #fff;
  }

  /* Transitions & keyframes */
  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translate(-50%, 8px);
  }
  .toast-enter-active,
  .toast-leave-active {
    transition: all 220ms ease;
  }

  @keyframes pop {
    0% {
      transform: scale(0.94);
    }
    50% {
      transform: scale(1.03);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes sweep {
    0% {
      transform: translateX(-120%) skewX(-15deg);
    }
    60% {
      transform: translateX(120%) skewX(-15deg);
    }
    100% {
      transform: translateX(120%) skewX(-15deg);
    }
  }

  @keyframes glow {
    0% {
      opacity: 0;
      filter: blur(10px);
    }
    100% {
      opacity: 1;
      filter: blur(0);
    }
  }

  @keyframes floaty {
    from {
      transform: translate(calc(var(--x) - 4px), calc(var(--y) - 6px))
        rotate(-2deg);
      opacity: 0.7;
    }
    to {
      transform: translate(calc(var(--x) + 4px), calc(var(--y) + 6px))
        rotate(2deg);
      opacity: 1;
    }
  }
</style>
