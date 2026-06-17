<template>
  <div class="eng-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">🎃 Halloween Spirit Test 🎃</h2>

    <!-- Intro -->
    <div v-if="phase === 'intro'" class="card">
      <p>Test your Halloween spirit and unlock the Jack-o-Lantern Capability!</p>
      <ul class="bullets">
        <li>10 short multiple-choice questions.</li>
        <li>Trust your instincts and see what spooky surprises await!</li>
      </ul>
      <button class="btn primary" @click="start">Start</button>
    </div>

    <!-- Quiz -->
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

        <p v-if="warning" class="warning">{{ warning }}</p>
      </div>

      <div class="nav">
        <button class="btn" :disabled="index === 0" @click="prev">Back</button>
        <button class="btn primary" @click="next">
          {{ index === questions.length - 1 ? "Finish" : "Next" }}
        </button>
      </div>
    </div>

    <!-- Result -->
    <div v-else-if="phase === 'result'" class="card result">
      <h3>Your result</h3>
      <p class="score">🎃 You got <strong>all {{ questions.length }}</strong> right!</p>
      <p class="level">
        Spirit Level: <span class="badge">Jack-o-Lantern</span>
      </p>
      <p class="desc">
        Glowing with Halloween energy — you’re officially ready to haunt the network!
      </p>

      <details class="review">
        <summary>Review your spooky answers</summary>
        <ol>
          <li v-for="(q, i) in questions" :key="i" class="review-item">
            <div class="r-q" v-html="q.prompt"></div>
            <div class="r-a ok">
              <p>Your answer: {{ answers[i] || "-" }}</p>
              <p>Correct answer: {{ answers[i] || "-" }}</p>
            </div>
          </li>
        </ol>
      </details>

      <div class="nav center-align">
        <button class="btn primary next-btn" @click="showAward = true">Claim Capability</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const phase = ref("intro");
const index = ref(0);
const answers = ref([]);
const showAward = ref(false);
const warning = ref("");

const questions = ref([
  {
    prompt: "What do you call a ghost who loves data labeling?",
    options: [
      "A Boo-tstrapper",
      "A Phantom Annotator",
      "The Spreadsheet Spirit",
      "Casper the Contributor",
    ],
  },
  {
    prompt: "Which candy best represents a balanced capability system?",
    options: [
      "Twix - two sides working in harmony",
      "Skittles - colorful diversity of tasks",
      "Snickers - satisfies every worker",
      "Candy Corn - sweet but confusingly centralized",
    ],
  },
  {
    prompt:
      "On Halloween night, your computer starts typing by itself. What's the most logical conclusion?",
    options: [
      "AI possession",
      "Your keyboard's haunted",
      "The ghosts are submitting microtasks",
      "You forgot to close Discord",
    ],
  },
  {
    prompt: "Which classic monster would make the best community manager?",
    options: [
      "Dracula - keeps everyone in the loop at night",
      "The Mummy - wraps up all conversations",
      "Frankenstein - always piecing ideas together",
      "The Werewolf - perfect for full moon feedback sessions",
    ],
  },
  {
    prompt: "What's the official Halloween greeting on Effect Alpha?",
    options: [
      "Trick or Task!",
      "Happy Haunt-work!",
      "May your pumpkins be verified!",
      "Boo to Bugs, Yay to Bounties!",
    ],
  },
  {
    prompt:
      "You're walking through a pumpkin patch at midnight and hear rustling. What do you find?",
    options: [
      "A pumpkin with glowing eyes, your Jack-o-Lantern Capability",
      "A lost test worker debugging a scarecrow",
      "The ghost of a half-completed task",
      "A candy wrapper labeled 'Bug Fixes'",
    ],
  },
  {
    prompt: "What's the most terrifying sound for a Halloween night coder?",
    options: [
      "Payment failed",
      "File corrupted",
      "A whisper saying 'Merge conflict…'",
      "None - silence means the spirits are watching",
    ],
  },
  {
    prompt: "Which Halloween creature best represents an AI model?",
    options: [
      "Frankenstein - built from many parts",
      "A witch's cauldron - full of mysterious recipes",
      "A ghost - it learns from past lives",
      "The Headless Horseman - still running but with no prompt in sight",
    ],
  },
  {
    prompt:
      "You're invited to a haunted house party for developers. What's the dress code?",
    options: [
      "Smart casual with capes",
      "Zombie chic - undead but functional",
      "Full-stack Frankenstein",
      "No masks - all identities are on-chain",
    ],
  },
  {
    prompt: "What happens when you finish this spooky quiz?",
    options: [
      "You gain the Jack-o-Lantern Capability",
      "You earn infinite candy and eternal bragging rights",
      "You get haunted by incomplete tasks",
      "You unlock Trick or Treat Mode on Effect Alpha",
    ],
  },
]);

const current = computed(() => questions.value[index.value]);

function start() {
  phase.value = "quiz";
  index.value = 0;
  answers.value = Array(questions.value.length).fill(null);
}

function next() {
  if (!answers.value[index.value]) {
    warning.value = "Please select an answer before continuing.";
    return;
  }

  warning.value = "";
  if (index.value < questions.value.length - 1) {
    index.value++;
  } else {
    phase.value = "result";
    // Award capability immediately when reaching result
    awardCapability(capability?.id);
  }
}

function prev() {
  warning.value = "";
  if (index.value > 0) index.value--;
}

const { availableCapabilities, awardCapability } = useCapabilities();
const capability = availableCapabilities.find((c) =>
  c.id.startsWith("effectai/halloween-spirit")
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
  background: #f97316;
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
  background: #fff7ed;
}
.warning {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 4px;
  text-align: center;
  transition: opacity 0.3s ease;
}
.nav {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}
.nav.center-align {
  justify-content: center;
}
.next-btn {
  background: linear-gradient(180deg, #ffffff, #fff7ed);
  border: 1px solid #fed7aa;
  color: #1f2937;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 8px 16px -10px rgba(249, 115, 22, 0.45);
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
.btn.primary {
  border-color: #fed7aa;
  background: linear-gradient(180deg, #fff, #fff7ed);
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
  background: #fff7ed;
  color: #c2410c;
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
</style>
