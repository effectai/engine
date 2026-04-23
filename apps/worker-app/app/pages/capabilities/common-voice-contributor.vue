<template>
  <div class="cv-contrib-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">Common Voice Sentence Contribution Test (10-15min)</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This test evaluates your understanding of sentence contribution best practices for the Common Voice dataset.</p>
      <br>
      <p><strong>Focus:</strong> Text generation quality, linguistic integrity, policy compliance</p>
      <br>
      <p>The test consists of <strong>30 questions</strong> covering:</p>
      <ul class="bullets">
        <li><strong>- Sentence Purpose & Dataset Integrity</strong></li>
        <li><strong>- Originality & Copyright</strong></li>
        <li><strong>- Sentence Structure & Length</strong></li>
        <li><strong>- Readability & Speakability</strong></li>
        <li><strong>- Numbers, Symbols & Formatting</strong></li>
        <li><strong>- Grammar, Clarity & Neutrality</strong></li>
        <li><strong>- Bias, Safety & Content Restrictions</strong></li>
        <li><strong>- Language Consistency & Locale</strong></li>
        <li><strong>- Dataset Diversity & Usefulness</strong></li>
        <li><strong>- Final Quality Judgment</strong></li>
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
  // Sentence Purpose & Dataset Integrity
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What is the primary goal of sentences added to Common Voice?",
    "options": [
      "To express personal opinions",
      "To train speech recognition models with diverse, natural language",
      "To showcase creative writing",
      "To increase dataset size as quickly as possible"
    ],
    "answer": "To train speech recognition models with diverse, natural language"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why is sentence naturalness critical for Common Voice?",
    "options": [
      "It improves readability for humans only",
      "It ensures sentences sound like real spoken language",
      "It reduces review workload",
      "It allows for longer sentences"
    ],
    "answer": "It ensures sentences sound like real spoken language"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence best fits Common Voice's intended use?",
    "options": [
      "The aforementioned individual proceeded accordingly.",
      "I forgot my keys again this morning.",
      "In compliance with subsection 3.2…",
      "Utilizing optimized paradigms, the system…"
    ],
    "answer": "I forgot my keys again this morning."
  },

  // Originality & Copyright
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which source is acceptable for contributing sentences?",
    "options": [
      "A paragraph from a news article",
      "Lyrics from a song",
      "A sentence you personally wrote",
      "A movie quote"
    ],
    "answer": "A sentence you personally wrote"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why are copyrighted texts disallowed?",
    "options": [
      "They are harder to read aloud",
      "They reduce sentence diversity",
      "They cannot be redistributed under open licenses",
      "They are usually too long"
    ],
    "answer": "They cannot be redistributed under open licenses"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence is most likely to violate copyright rules?",
    "options": [
      "The cat slept on the warm windowsill.",
      "May the Force be with you.",
      "Rain started falling just after sunset.",
      "She waved before boarding the train."
    ],
    "answer": "May the Force be with you."
  },

  // Sentence Structure & Length
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What sentence length is generally preferred?",
    "options": [
      "Extremely short phrases",
      "Very long compound sentences",
      "Medium-length, natural sentences",
      "Paragraph-length text"
    ],
    "answer": "Medium-length, natural sentences"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence should be rejected for structure?",
    "options": [
      "I checked the weather before leaving.",
      "After work, we went for tacos.",
      "Running fast.",
      "She laughed when the dog sneezed."
    ],
    "answer": "Running fast."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why are sentence fragments discouraged?",
    "options": [
      "They are harder to validate",
      "They do not reflect natural speech patterns",
      "They slow down recording",
      "They reduce speaker confidence"
    ],
    "answer": "They do not reflect natural speech patterns"
  },

  // Readability & Speakability
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence is least suitable for reading aloud?",
    "options": [
      "I'll call you later tonight.",
      "The sun rose over the hills.",
      "HTTP colon slash slash example dot com.",
      "He forgot his umbrella again."
    ],
    "answer": "HTTP colon slash slash example dot com."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why are URLs and code discouraged?",
    "options": [
      "They are copyrighted",
      "They introduce unnatural speech patterns",
      "They are difficult to spell",
      "They are language-specific"
    ],
    "answer": "They introduce unnatural speech patterns"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence best supports natural pronunciation?",
    "options": [
      "$5.99 is the total.",
      "The total is five dollars and ninety-nine cents.",
      "Total: 5.99 USD.",
      "Pay 5.99 now."
    ],
    "answer": "The total is five dollars and ninety-nine cents."
  },

  // Numbers, Symbols & Formatting
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "How should numbers generally appear in sentences?",
    "options": [
      "Always as digits",
      "Always spelled out when possible",
      "Mixed randomly",
      "Avoided entirely"
    ],
    "answer": "Always spelled out when possible"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence follows best practice?",
    "options": [
      "I ran 5km today.",
      "I ran five kilometers today.",
      "I ran V kilometers today.",
      "I ran five km's today."
    ],
    "answer": "I ran five kilometers today."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why is excessive punctuation discouraged?",
    "options": [
      "It looks informal",
      "It confuses text validators",
      "It alters speech rhythm unnaturally",
      "It increases rejection rates"
    ],
    "answer": "It alters speech rhythm unnaturally"
  },

  // Grammar, Clarity & Neutrality
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What should contributors prioritize over stylistic flair?",
    "options": [
      "Complex vocabulary",
      "Personal voice",
      "Clarity and correctness",
      "Humor"
    ],
    "answer": "Clarity and correctness"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence should be rejected for ambiguity?",
    "options": [
      "They arrived late.",
      "The meeting started at noon.",
      "She placed it there.",
      "We left after lunch."
    ],
    "answer": "She placed it there."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why is neutral language preferred?",
    "options": [
      "It avoids bias in speech models",
      "It is easier to translate",
      "It sounds more formal",
      "It reduces moderation effort"
    ],
    "answer": "It avoids bias in speech models"
  },

  // Bias, Safety & Content Restrictions
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which topic should be avoided?",
    "options": [
      "Daily routines",
      "Neutral observations",
      "Hate speech or harassment",
      "Weather descriptions"
    ],
    "answer": "Hate speech or harassment"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why must sentences avoid targeting groups or individuals?",
    "options": [
      "It increases dataset size",
      "It prevents biased model outputs",
      "It simplifies validation",
      "It improves pronunciation"
    ],
    "answer": "It prevents biased model outputs"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence should be rejected immediately?",
    "options": [
      "I missed the bus today.",
      "Everyone deserves respect.",
      "That group should be kicked out.",
      "She enjoys early mornings."
    ],
    "answer": "That group should be kicked out."
  },

  // Language Consistency & Locale
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What should contributors do when writing for a specific language?",
    "options": [
      "Mix dialects freely",
      "Follow standard grammar and spelling for that language",
      "Translate directly from English",
      "Use slang whenever possible"
    ],
    "answer": "Follow standard grammar and spelling for that language"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why is mixing languages in one sentence discouraged?",
    "options": [
      "It increases validation time",
      "It confuses speech recognition models",
      "It lowers engagement",
      "It violates copyright"
    ],
    "answer": "It confuses speech recognition models"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence should be rejected for language consistency?",
    "options": [
      "I enjoy reading every night.",
      "Vamos to the store later.",
      "The cat slept peacefully.",
      "She smiled and waved."
    ],
    "answer": "Vamos to the store later."
  },

  // Dataset Diversity & Usefulness
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Why is sentence diversity important?",
    "options": [
      "It makes the dataset larger",
      "It improves model robustness",
      "It speeds up recordings",
      "It simplifies reviews"
    ],
    "answer": "It improves model robustness"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which pair of sentences best demonstrates useful diversity?",
    "options": [
      "\"I like coffee.\" / \"I like tea.\"",
      "\"The cat sat.\" / \"The cat sat again.\"",
      "\"She fixed the bike chain.\" / \"The storm knocked out power.\"",
      "\"Hello there.\" / \"Hello there!\""
    ],
    "answer": "\"She fixed the bike chain.\" / \"The storm knocked out power.\""
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What should contributors avoid submitting repeatedly?",
    "options": [
      "Sentences with verbs",
      "Similar sentence patterns",
      "Past tense sentences",
      "Short sentences"
    ],
    "answer": "Similar sentence patterns"
  },

  // Final Quality Judgment
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence best meets all Common Voice standards?",
    "options": [
      "Click OK to continue.",
      "She adjusted the mirror before driving away.",
      "Breaking news just in.",
      "LOL that was funny."
    ],
    "answer": "She adjusted the mirror before driving away."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "If unsure whether a sentence meets guidelines, what is the best action?",
    "options": [
      "Submit it anyway",
      "Rewrite it more clearly",
      "Copy from a trusted source",
      "Add punctuation"
    ],
    "answer": "Rewrite it more clearly"
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "What ultimately determines whether a sentence belongs in Common Voice?",
    "options": [
      "Contributor intent",
      "Sentence length",
      "Suitability for spoken language modeling",
      "Reviewer preference"
    ],
    "answer": "Suitability for spoken language modeling"
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
// Require at least 24/30 (80%) to pass
const passed = computed(() =>
  phase.value === "result" &&
  questions.value.length >= MIN_QUESTIONS_TO_PASS &&
  score.value >= Math.ceil(questions.value.length * 0.8)
);

const resultDescription = computed(() => {
  if (passed.value) {
    return "Congratulations! You have demonstrated strong understanding of Common Voice sentence contribution best practices.";
  } else {
    return "Please review the Common Voice contribution guidelines and try again.";
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
  c.id.startsWith("effectai/common-voice-contributor"),
);
</script>

<style scoped>
  .cv-contrib-test {
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
