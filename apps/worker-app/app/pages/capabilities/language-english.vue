<template>
  <div class="eng-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">English Proficiency Quick Test (5-10min)</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This short test estimates your CEFR level (A1-C1).</p>
      <br>
      <p>The test consists of <strong>25 questions</strong>:</p>
      <ul class="bullets">
        <li><strong>- 12 Multiple Choice</strong></li>
        <li><strong>- 8 Fill-in-the-Blank</strong></li>
        <li><strong>- 5 Reading Comprehension</strong></li>
      </ul>
      <p>Please note the following rules:</p>
      <ul class="bullets">
        <li><strong>Timed Questions:</strong> Each question has a countdown timer. If time runs out, your current answer will be automatically submitted.</li>
        <li><strong>Forward Only:</strong> Once you submit a question, you cannot return to it.</li>
        <li><strong>No Copy & Paste:</strong> Copying, pasting, or cutting text is disabled.</li>
      </ul>
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

        <div v-else-if="current.type === 'cloze'">
          <input
            v-model.trim="answers[index]"
            class="input"
            :placeholder="current.placeholder || 'Type your answer'"
            @keydown.enter.prevent="next"
            @paste.prevent
            @copy.prevent
            @cut.prevent
            autocomplete="off"
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

      <div class="nav right-align">
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

      <!-- <details class="review">
        <summary>Review answers</summary>
        <ol>
          <li v-for="(q, i) in questions" :key="i" class="review-item">
            <div class="r-q" v-html="q.prompt"></div>
            <div class="r-a">
              <span :class="answers[i] === q.answer ? 'ok' : 'bad'">
                Your answer: {{ formatAns(answers[i]) }}
              </span>
              <span v-if="answers[i] !== q.answer">
                • Correct: <strong>{{ formatAns(q.answer) }}</strong>
              </span>
            </div>
          </li>
        </ol>
      </details> -->

      <div class="nav">
        <button v-if="!passed" class="btn" @click="reset">Restart</button>
        <UButton v-if="passed" @click="showAward = true">Next</UButton>
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

const masterBank = [
  {
    type: "mcq",
    duration: 30,
    prompt: "Select the sentence that is grammatically correct and natural:",
    options: [
      "I have been working here for three years.",
      "I am working here since three years.",
      "I work here since three years ago.",
    ],
    answer: "I have been working here for three years.",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Context: Data Transcription.<br><em>The handwriting was illegible, so I could not ___ the text.</em>",
    options: ["transcribe", "describe", "prescribe"],
    answer: "transcribe",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Hypothetical: <em>If I ___ known about the bug, I would have fixed it.</em>",
    options: ["have", "had", "was"],
    answer: "had",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Connector: <em>The model is accurate; ___, it is very slow.</em>",
    options: ["therefore", "however", "consequently"],
    answer: "however",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Vocabulary: <em>To 'mitigate' a risk means to:</em>",
    options: ["increase it", "reduce it", "ignore it"],
    answer: "reduce it",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Phrasal Verb: <em>We need to look ___ the potential causes.</em>",
    options: ["into", "onto", "under"],
    answer: "into",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Select the most natural sentence for a past event:",
    options: [
      "I finished the task yesterday.",
      "I have finished the task yesterday.",
      "I finish the task yesterday.",
    ],
    answer: "I finished the task yesterday.",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Word Choice: <em>The results were ___, matching our expectations perfectly.</em>",
    options: ["consistent", "contradictory", "random"],
    answer: "consistent",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Grammar: <em>Neither the manager nor the developers ___ aware of the issue.</em>",
    options: ["was", "were", "is"],
    answer: "were",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Grammar: <em>She prefers tea ___ coffee.</em>",
    options: ["than", "over", "to"],
    answer: "to",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Vocabulary: <em>To 'allocate' resources means to:</em>",
    options: ["distribute", "waste", "reserve"],
    answer: "distribute",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Choose the correct sentence:",
    options: ["He don't like pizza.", "He doesn't like pizza.", "He not likes pizza."],
    answer: "He doesn't like pizza.",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Connector: <em>I was tired; ___, I went to the gym.</em>",
    options: ["therefore", "although", "because"],
    answer: "although",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Word Choice: <em>The meeting was postponed due to ___ weather conditions.</em>",
    options: ["adverse", "favorable", "neutral"],
    answer: "adverse",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Select the most natural sentence:",
    options: ["I am knowing him for years.", "I have known him for years.", "I knowed him for years."],
    answer: "I have known him for years.",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Phrasal Verb: <em>We need to ___ the issue immediately.</em>",
    options: ["look into", "look over", "look for"],
    answer: "look into",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Grammar: <em>If I ___ you, I would apologize.</em>",
    options: ["am", "were", "was"],
    answer: "were",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Vocabulary: <em>'Ambiguous' means:</em>",
    options: ["clear", "uncertain", "funny"],
    answer: "uncertain",
  },
  {
    type: "mcq",
    duration: 25,
    prompt: "Choose correct form: <em>He suggested that she ___ earlier.</em>",
    options: ["arrives", "arrive", "arrived"],
    answer: "arrive",
  },
  {
    type: "mcq",
    duration: 30,
    prompt: "Grammar: <em>Neither of the answers ___ correct.</em>",
    options: ["is", "are", "were"],
    answer: "is",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Type the missing word: <em>She is responsible ___ managing the project.</em>",
    answer: "for",
    hint: "Preposition",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Fill in: <em>Please ___ sure you save your work.</em>",
    answer: "make",
    placeholder: "Type a verb",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Passive Voice: <em>The email was ___ by the manager.</em>",
    answer: "written",
    hint: "Verb 'to write'",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Spelling: <em>The feature is ___ (needed) for the launch.</em>",
    answer: "necessary",
    placeholder: "Starts with n...",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Preposition: <em>He is interested ___ learning Python.</em>",
    answer: "in",
    hint: "at / on / in",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Fill in: <em>He is good ___ mathematics.</em>",
    answer: "at",
    hint: "Preposition",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Complete: <em>We look forward ___ hearing from you.</em>",
    answer: "to",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Type the missing word: <em>The manager asked him to ___ the report by Friday.</em>",
    answer: "submit",
    placeholder: "Verb",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Spelling: <em>It is ___ to follow the instructions carefully.</em>",
    answer: "essential",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Fill in: <em>She is capable ___ leading the team.</em>",
    answer: "of",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Complete: <em>They insisted ___ paying for the damages.</em>",
    answer: "on",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Type the missing word: <em>The project was completed ___ time.</em>",
    answer: "on",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Fill in: <em>He was accused ___ cheating on the exam.</em>",
    answer: "of",
  },
  {
    type: "cloze",
    duration: 25,
    prompt: "Complete: <em>She succeeded ___ passing the test.</em>",
    answer: "in",
  },
  {
    type: "cloze",
    duration: 30,
    prompt: "Type the missing word: <em>It is important to ___ a healthy lifestyle.</em>",
    answer: "maintain",
  },
  {
    type: "reading",
    duration: 60,
    prompt: "Read the instruction and decide on the action.",
    passage: [
      "Task: Label all vehicles.",
      "Constraint: Do not label vehicles that are more than 50% occluded (blocked) by other objects.",
      "Scenario: You see a car parked behind a tree. Only the rear bumper is visible.",
    ],
    options: ["Label the car.", "Do not label the car.", "Label the tree."],
    answer: "Do not label the car.",
  },
  {
    type: "reading",
    duration: 50,
    prompt: "Instruction Comprehension:",
    passage: [
      "The summary must be concise. Detailed explanations go in the appendix. The main body text must not exceed 200 words.",
    ],
    options: [
      "The summary should be long.",
      "Details go in the appendix; main text is short.",
      "The appendix must not exceed 200 words.",
    ],
    answer: "Details go in the appendix; main text is short.",
  },
  {
    type: "reading",
    duration: 50,
    prompt: "Contextual Judgment:",
    passage: [
      "User Query: 'Show me red shoes.'",
      "Result: An image of red boots.",
      "Guideline: Boots are considered a sub-category of shoes.",
    ],
    options: ["Mark as Match", "Mark as Mismatch", "Mark as Unsure"],
    answer: "Mark as Match",
  },
  {
    type: "reading",
    duration: 55,
    prompt: "Logistics Instruction:",
    passage: [
      "All invoices must be submitted by Friday at 5 PM. Invoices submitted after this time will be processed the following week.",
      "Scenario: You submit an invoice on Friday at 6 PM.",
    ],
    options: [
      "It is processed immediately.",
      "It is processed next week.",
      "It is rejected permanently.",
    ],
    answer: "It is processed next week.",
  },
  {
    type: "reading",
    duration: 55,
    prompt: "Instruction Comprehension:",
    passage: [
      "All employees must wear ID badges while on company premises.",
      "Scenario: An employee forgot their badge at home.",
    ],
    options: ["They can enter anyway.", "They must not enter.", "They must make a temporary badge."],
    answer: "They must make a temporary badge.",
  },
  {
    type: "reading",
    duration: 50,
    prompt: "Contextual Judgment:",
    passage: [
      "User Query: 'I need a blue notebook.'",
      "Result: An image of a red notebook.",
    ],
    options: ["Mark as Match", "Mark as Mismatch", "Mark as Unsure"],
    answer: "Mark as Mismatch",
  },
  {
    type: "reading",
    duration: 60,
    prompt: "Task: Follow the instructions below.",
    passage: [
      "Instruction: Highlight all the nouns in the text.",
      "Text: 'The cat chased the mouse under the table.'",
    ],
    options: ["Highlight 'cat' and 'mouse'", "Highlight all words", "Highlight 'table' only"],
    answer: "Highlight 'cat' and 'mouse'",
  },
  {
    type: "reading",
    duration: 50,
    prompt: "Instruction Comprehension:",
    passage: [
      "Submit your timesheet by 5 PM on Friday.",
      "Scenario: It's Friday at 4 PM.",
    ],
    options: ["Submit now", "Submit next week", "Ignore"],
    answer: "Submit now",
  },
  {
    type: "reading",
    duration: 55,
    prompt: "Contextual Judgment:",
    passage: [
      "The client requested a report in PDF format.",
      "You submitted a Word document.",
    ],
    options: ["Correct format", "Incorrect format", "Ask client"],
    answer: "Incorrect format",
  },
  {
    type: "reading",
    duration: 50,
    prompt: "Instruction Comprehension:",
    passage: [
      "All visitors must sign in at the reception desk.",
      "Scenario: A visitor bypasses the desk.",
    ],
    options: ["Sign in later", "Violation of rules", "Allowed entry"],
    answer: "Violation of rules",
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
  const mcqBank = masterBank.filter(q => q.type === "mcq");
  const clozeBank = masterBank.filter(q => q.type === "cloze");
  const readingBank = masterBank.filter(q => q.type === "reading");

  const selectedMCQ = shuffleArray(mcqBank).slice(0, 12);
  const selectedCloze = shuffleArray(clozeBank).slice(0, 8);
  const selectedReading = shuffleArray(readingBank).slice(0, 5);

  questions.value = shuffleArray([...selectedMCQ, ...selectedCloze, ...selectedReading]);

  answers.value = Array(questions.value.length).fill(null);
  phase.value = "quiz";
  index.value = 0;
  startTimer();
}


function next() {
  clearInterval(timerInterval);
  
  if (index.value < questions.value.length - 1) {
    index.value++;
    startTimer();
  } else {
    phase.value = "result";
  }
}

function reset() {
  clearInterval(timerInterval);
  phase.value = "intro";
  index.value = 0;
  answers.value = [];
  questions.value = [];
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

const level = computed(() => {
  const s = score.value;
  const total = questions.value.length;
  if (total === 0) return { cefr: "—", description: "" };
  
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

const passed = computed(() => phase.value === "result" && score.value >= 8);
const showAward = ref(false);

function formatAns(a) {
  return a == null || a === "" ? "— (Time expired)" : a;
}

onUnmounted(() => {
  clearInterval(timerInterval);
});

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
    margin-top: 14px;
    display: flex;
    gap: 10px;
  }
  .nav.right-align {
    justify-content: flex-end;
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
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style>