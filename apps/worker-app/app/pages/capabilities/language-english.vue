<template>
  <div class="eng-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">English Proficiency Quick Test</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This short test (≈5–7 minutes) estimates your CEFR level (A1–C1).</p>
      <ul class="bullets">
        <li>Multiple choice + a few short “type the word” questions.</li>
        <li>No penalties for guessing. One point per correct answer.</li>
      </ul>
      <button class="btn primary" @click="start">Start</button>
    </div>

    <div v-else-if="phase === 'quiz'" class="card">
      <div class="topbar">
        <div class="progress">
          <div
            class="bar"
            :style="{ width: ((index + 1) / questions.length) * 100 + '%' }"
          ></div>
        </div>
        <div class="count">{{ index + 1 }} / {{ questions.length }}</div>
      </div>

      <div class="qwrap">
        <div class="qtext" v-html="current.prompt"></div>

        <div v-if="current.type === 'mcq'" class="options">
          <label v-for="opt in current.options" :key="opt" class="opt">
            <input
              type="radio"
              :name="'q' + index"
              :value="opt"
              v-model="answers[index]"
            />
            <span>{{ opt }}</span>
          </label>
        </div>

        <div v-else-if="current.type === 'cloze'">
          <input
            v-model.trim="answers[index]"
            class="input"
            :placeholder="current.placeholder || 'Type your answer'"
            @keydown.enter.prevent="next"
          />
          <p class="hint" v-if="current.hint">Hint: {{ current.hint }}</p>
        </div>

        <div v-else-if="current.type === 'reading'">
          <div class="passage">
            <p v-for="(p, i) in current.passage" :key="i">{{ p }}</p>
          </div>
          <div class="options">
            <label v-for="opt in current.options" :key="opt" class="opt">
              <input
                type="radio"
                :name="'q' + index"
                :value="opt"
                v-model="answers[index]"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="nav">
        <button class="btn" :disabled="index === 0" @click="prev">Back</button>
        <button class="btn primary" @click="next">
          {{ index === questions.length - 1 ? "Finish" : "Next" }}
        </button>
      </div>
    </div>

    <div v-else-if="phase === 'result'" class="card result">
      <h3>Your result</h3>
      <p class="score">
        Score: <strong>{{ score }}</strong> / {{ questions.length }}
      </p>
      <p class="level">
        Estimated level: <span class="badge">{{ level.cefr }}</span>
      </p>
      <p class="desc">{{ level.description }}</p>

      <details class="review">
        <summary>Review answers</summary>
        <ol>
          <li v-for="(q, i) in questions" :key="i" class="review-item">
            <div class="r-q" v-html="q.prompt"></div>
            <div class="r-a">
              <span :class="answers[i] === q.answer ? 'ok' : 'bad'">
                Your answer: {{ formatAns(answers[i]) }}
              </span>
              <span>
                • Correct: <strong>{{ formatAns(q.answer) }}</strong></span
              >
            </div>
          </li>
        </ol>
      </details>

      <div class="nav">
        <button v-if="!passed" class="btn" @click="reset">Restart</button>
        <UButton v-if="passed" @click="showAward = true">Next</UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const phase = ref("intro");
const index = ref(0);
const answers = ref([]);

// Minimal question set (12). You can extend/replace easily.
const questions = ref([
  {
    type: "mcq",
    prompt:
      "Choose the correct option: <em>She ___ to the gym every morning.</em>",
    options: ["go", "goes", "is go"],
    answer: "goes",
  },
  {
    type: "mcq",
    prompt:
      "Pick the best word: <em>It was a very ___ day, so we stayed inside.</em>",
    options: ["rain", "rains", "rainy"],
    answer: "rainy",
  },
  {
    type: "cloze",
    prompt:
      "Type the missing preposition: <em>We arrived ___ the airport at 9.</em>",
    answer: "at",
    hint: "at / in / on",
  },
  {
    type: "mcq",
    prompt: "Past simple: <em>They ___ the film last night.</em>",
    options: ["see", "saw", "seen"],
    answer: "saw",
  },
  {
    type: "mcq",
    prompt: "Comparatives: <em>This road is ___ than the other.</em>",
    options: ["more narrow", "narrower", "most narrow"],
    answer: "narrower",
  },
  {
    type: "cloze",
    prompt: "Spell the word for “necessary for life”:",
    answer: "essential",
    placeholder: "Type a single word",
  },
  {
    type: "mcq",
    prompt: "Meaning: <em>“to postpone”</em> =",
    options: ["bring forward", "call off", "put off"],
    answer: "put off",
  },
  {
    type: "mcq",
    prompt: "Choose the best sentence:",
    options: [
      "If it will rain, we will cancel.",
      "If it rains, we will cancel.",
      "If it rained, we will cancel.",
    ],
    answer: "If it rains, we will cancel.",
  },
  {
    type: "cloze",
    prompt: "Fill in: <em>I have lived here ___ 2018.</em>",
    answer: "since",
    hint: "since/for",
  },
  {
    type: "mcq",
    prompt: "Choose the formal alternative:",
    options: ["kids", "children", "lads"],
    answer: "children",
  },
  {
    type: "reading",
    prompt: "Reading: choose the best summary.",
    passage: [
      "The museum extended its opening hours during the summer to accommodate tourists.",
      "However, due to staff shortages, guided tours will be limited to weekends only.",
    ],
    options: [
      "The museum is closed in summer.",
      "Tours run every day in summer.",
      "The museum is open longer in summer but tours are weekends only.",
    ],
    answer: "The museum is open longer in summer but tours are weekends only.",
  },
  {
    type: "mcq",
    prompt: "Choose the best option: <em>If I had known, I ___ earlier.</em>",
    options: ["would leave", "would have left", "left"],
    answer: "would have left",
  },
]);

const current = computed(() => questions.value[index.value]);

function start() {
  phase.value = "quiz";
  index.value = 0;
  answers.value = Array(questions.value.length).fill(null);
}

function next() {
  if (index.value < questions.value.length - 1) {
    index.value++;
  } else {
    phase.value = "result";
  }
}

function prev() {
  if (index.value > 0) index.value--;
}

function reset() {
  phase.value = "intro";
  index.value = 0;
  answers.value = [];
}

function normalize(a) {
  if (a == null) return "";
  return String(a).trim().toLowerCase();
}

const score = computed(() =>
  questions.value.reduce((sum, q, i) => {
    const user = answers.value[i];
    if (q.type === "cloze") {
      return sum + (normalize(user) === normalize(q.answer) ? 1 : 0);
    } else {
      return sum + (user === q.answer ? 1 : 0);
    }
  }, 0),
);

// Rough CEFR mapping (tune as needed)
const level = computed(() => {
  const s = score.value;
  const total = questions.value.length;
  const pct = (s / total) * 100;
  if (pct < 30)
    return {
      cefr: "A1",
      description: "Basic: can understand and use very simple expressions.",
    };
  if (pct < 50)
    return {
      cefr: "A2",
      description: "Elementary: can communicate in simple, routine tasks.",
    };
  if (pct < 70)
    return {
      cefr: "B1",
      description:
        "Intermediate: can deal with most situations while traveling.",
    };
  if (pct < 85)
    return {
      cefr: "B2",
      description:
        "Upper-intermediate: can interact with fluency and spontaneity.",
    };
  return {
    cefr: "C1",
    description:
      "Advanced: can use language flexibly and effectively for social, academic, and professional purposes.",
  };
});

const passed = computed(() => phase.value === "result" && score.value >= 8); // pass if 8 or more correct
const showAward = ref(false);

function formatAns(a) {
  return a == null || a === "" ? "—" : a;
}

const { availableCapabilities } = useCapabilities();

const capability = availableCapabilities.find((c) =>
  c.id.startsWith("effectai/english-language"),
);
</script>

<style scoped>
  .eng-test {
    max-width: 720px;
    margin: 0 auto;
    padding: 12px;
  }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 10px 30px -16px rgba(0, 0, 0, 0.15);
  }
  .bullets {
    margin: 0.5rem 0 1rem;
    padding-left: 1.1rem;
  }
  .bullets li {
    margin: 0.25rem 0;
  }
  .topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .progress {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    background: #6366f1;
  }
  .count {
    color: #475569;
    font-size: 0.9rem;
  }
  .qwrap {
    margin-top: 8px;
  }
  .qtext {
    font-size: 1.05rem;
    margin-bottom: 0.75rem;
  }
  .options {
    display: grid;
    gap: 8px;
  }
  .opt {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
  }
  .opt:hover {
    background: #f8fafc;
  }
  .input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 1rem;
  }
  .hint {
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 0.4rem;
  }
  .nav {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 14px;
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
  .result {
    text-align: center;
  }
  .score {
    font-size: 1.1rem;
    margin: 0.25rem 0;
  }
  .level {
    margin: 0.25rem 0 0.5rem;
  }
  .badge {
    display: inline-block;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #3730a3;
    font-weight: 700;
  }
  .review {
    text-align: left;
    margin-top: 12px;
  }
  .review-item {
    margin: 0.4rem 0;
  }
  .r-q {
    font-weight: 600;
  }
  .r-a {
    color: #475569;
  }
  .ok {
    color: #16a34a;
  }
  .bad {
    color: #dc2626;
  }
</style>
