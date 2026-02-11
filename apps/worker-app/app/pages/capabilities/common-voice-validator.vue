<template>
  <div class="cv-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">Common Voice Sentence Validator Test (10-15min)</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This test evaluates your ability to validate sentences for the Common Voice dataset.</p>
      <br>
      <p>The test consists of <strong>30 questions</strong> covering:</p>
      <ul class="bullets">
        <li><strong>- Validator Responsibility & Dataset Fit</strong></li>
        <li><strong>- Naturalness & Speakability</strong></li>
        <li><strong>- Sentence Structure & Completeness</strong></li>
        <li><strong>- Numbers, Symbols & Formatting</strong></li>
        <li><strong>- Originality & Copyright Risk</strong></li>
        <li><strong>- Bias, Safety & Neutrality</strong></li>
        <li><strong>- Language Consistency & Locale</strong></li>
        <li><strong>- Dataset Usefulness & Redundancy</strong></li>
      </ul>
      <p>Please note the following rules:</p>
      <ul class="bullets">
        <li><strong>Timed Questions:</strong> Each question has a countdown timer. If time runs out, your current answer will be automatically submitted.</li>
        <li><strong>Forward Only:</strong> Once you submit a question, you cannot return to it.</li>
      </ul>
      <br>
      <p><strong>Passing Score:</strong> You need to score at least 80% (24/30 correct) to pass.</p>
      <br>
      <div style="display: flex; justify-content: center; margin-top: 16px;">
        <button class="is-flex btn primary" @click="start">Start Test</button>
      </div>
    </div>

    <div v-else-if="phase === 'quiz'" class="card">
      <div class="topbar">
        <div class="progress">
          <div
            class="bar"
            :style="{ width: ((index + 1) / questions.length) * 100 + '%' }"
          ></div>
        </div>
        <div class="meta">
          <span class="count">{{ index + 1 }} / {{ questions.length }}</span>
          <span :class="['timer', { urgent: timeLeft <= 10 }]">
            ⏱ {{ formatTime(timeLeft) }}
          </span>
        </div>
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
      </div>

      <div class="nav right-align">
        <button class="btn primary" @click="next" :disabled="transitioning">
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
        Status: <span class="badge">{{ passed ? 'Passed' : 'Not Passed' }}</span>
      </p>
      <p class="desc">{{ resultDescription }}</p>

      <div class="nav center-align">
        <button v-if="!passed" class="btn" @click="reset">Restart</button>
        <button v-if="passed" class="btn primary next-btn" @click="showAward = true">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";

const phase = ref("intro");
const index = ref(0);
const answers = ref([]);
const questions = ref([]);
const timeLeft = ref(0);
let timerInterval = null;

// Double-click protection
const transitioning = ref(false);

const masterBank = [
  // Validator Responsibility & Dataset Fit
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"I forgot my keys again this morning.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Click OK to continue.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"The sun rose slowly over the hills.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },

  // Naturalness & Speakability
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"HTTP colon slash slash example dot com.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"She adjusted the seat before driving away.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Breaking news just in.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },

  // Sentence Structure & Completeness
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Running late.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"After dinner, we watched a movie.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Because the weather was bad.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },

  // Numbers, Symbols & Formatting
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"The total is five dollars and ninety-nine cents.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Pay $5.99 now!\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"I ran five kilometers today.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },

  // Originality & Copyright Risk
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"May the Force be with you.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"The cat slept by the window all afternoon.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"To be or not to be, that is the question.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },

  // Bias, Safety & Neutrality
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Everyone deserves respect.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Those people should not be allowed here.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"I missed the bus again today.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },

  // Language Consistency & Locale
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Vamos to the store later.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"She smiled and waved goodbye.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"I enjoy reading books every night.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },

  // Dataset Usefulness & Redundancy
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"I like coffee.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"The storm knocked out power across the city.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Hello there!\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },

  // Final Judgment & Edge Cases
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"She placed it there.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"After checking the map, we took a different route home.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"LOL that was funny.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },

  // Validator Consistency Scenarios
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"The meeting starts at noon.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"Use this password to log in.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Reject"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Sentence: <strong>\"She adjusted the mirror before driving away.\"</strong><br>Should this be included in Common Voice?",
    "options": [
      "Accept",
      "Reject"
    ],
    "answer": "Accept"
  }
];

const current = computed(() => questions.value[index.value]);

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startTimer() {
  clearInterval(timerInterval);
  if (!current.value) return;

  timeLeft.value = current.value.duration;

  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      next(); // Force move to next question
    }
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function start() {
  // Check if user has attempts remaining before starting
  if (!hasAttemptsRemaining(capability?.id)) {
    console.warn("No attempts remaining");
    alert("You have no attempts remaining for this test.");
    return;
  }

  // Use all 30 questions in shuffled order
  questions.value = shuffleArray([...masterBank]);

  answers.value = Array(questions.value.length).fill(null);
  phase.value = "quiz";
  index.value = 0;

  // Increment attempt counter when test starts (not when it finishes)
  // This prevents users from starting multiple times to see questions
  incrementTestAttempt(capability?.id, false);

  startTimer();
}


function next() {
  // Prevent double-clicks
  if (transitioning.value) return;
  transitioning.value = true;

  clearInterval(timerInterval);

  if (index.value < questions.value.length - 1) {
    index.value++;
    startTimer();
    // Re-enable button after short delay
    setTimeout(() => { transitioning.value = false; }, 100);
  } else {
    phase.value = "result";

    // Award capability immediately when reaching result
    if (passed.value) {
      awardCapability(capability?.id);
      incrementTestAttempt(capability?.id, true);
    }
  }
}

function reset() {
  // Check if user has attempts remaining before allowing restart
  if (!hasAttemptsRemaining(capability?.id)) {
    console.warn("No attempts remaining");
    alert("You have no attempts remaining for this test.");
    return;
  }

  clearInterval(timerInterval);
  phase.value = "intro";
  index.value = 0;
  answers.value = [];
  questions.value = [];
  transitioning.value = false;
}

const score = computed(() =>
  questions.value.reduce((sum, q, i) => {
    const user = answers.value[i];
    return sum + (user === q.answer ? 1 : 0);
  }, 0),
);

// Minimum questions required to prevent skip exploit
const MIN_QUESTIONS_TO_PASS = 20;
// Require at least 80% to pass
const passed = computed(() =>
  phase.value === "result" &&
  questions.value.length >= MIN_QUESTIONS_TO_PASS &&
  score.value >= Math.ceil(questions.value.length * 0.8)
);

const resultDescription = computed(() => {
  if (passed.value) {
    return "Congratulations! You have demonstrated strong understanding of Common Voice sentence validation criteria.";
  } else {
    return "Please review the Common Voice validation guidelines and try again.";
  }
});

const showAward = ref(false);

onUnmounted(() => {
  clearInterval(timerInterval);
});

const {
  availableCapabilities,
  incrementTestAttempt,
  hasAttemptsRemaining,
  awardCapability,
} = useCapabilities();

const capability = availableCapabilities.find((c) =>
  c.id.startsWith("effectai/common-voice-validator"),
);
</script>

<style scoped>
  .cv-test {
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
    gap: 15px;
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
    transition: width 0.3s ease;
  }
  .meta {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 0.9rem;
    color: #475569;
  }
  .timer {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .timer.urgent {
    color: #dc2626;
    animation: pulse 1s infinite;
  }
  .qwrap {
    margin-top: 8px;
    min-height: 200px; /* Prevent layout shift */
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
  .nav {
    margin-top: 14px;
    display: flex;
    gap: 10px;
  }
  .nav.right-align {
    justify-content: flex-end;
  }
  .nav.center-align {
    justify-content: center;
  }
  .next-btn {
    background: linear-gradient(180deg, #ffffff, #f6f7ff);
    border: 1px solid #c7d2fe;
    color: #1f2937;
    padding: 12px 24px;
    font-weight: 600;
    box-shadow: 0 8px 16px -10px rgba(99, 102, 241, 0.45);
    transition: transform 0.15s ease;
  }
  .next-btn:hover {
    transform: translateY(-1px);
  }
  .next-btn:active {
    transform: translateY(0);
  }
  .btn {
    border: 1px solid #e5e7eb;
    padding: 10px 14px;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    font-weight: 600;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style>
