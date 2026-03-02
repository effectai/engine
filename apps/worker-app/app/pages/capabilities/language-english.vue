<template>
  <div class="eng-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">English Proficiency Quick Test (5-10min)</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This short test estimates your CEFR level (A1-C1).</p>
      <br>
      <p>The test consists of <strong>20 questions</strong>:</p>
      <ul class="bullets">
        <li><strong>- 15 Multiple Choice</strong></li>
        <li><strong>- 5 Reading Comprehension</strong></li>
      </ul>
      <p><strong>Passing Grade:</strong> You need at least <strong>75%</strong> (15/20 correct) to earn the capability.</p>
      <br>
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
        Estimated level: <span class="badge">{{ level.cefr }}</span>
      </p>
      <p class="desc">{{ level.description }}</p>

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
  {
    "type": "mcq",
    "duration": 55,
    "prompt": "You receive a message from a team lead: 'Please hold off on the Batch A annotations until the new guidelines are released.' What does this mean?",
    "options": [
      "You should finish Batch A quickly before the new guidelines arrive.",
      "You should stop working on Batch A temporarily.",
      "You should delete Batch A.",
      "You should continue working on Batch A using the old guidelines."
    ],
    "answer": "You should stop working on Batch A temporarily."
  },
  {
    "type": "mcq",
    "duration": 60,
    "prompt": "Read the customer message:\n\n'I ordered a blue shirt but received a red one. I'd like to exchange it for the correct color.'\n\nWhat does the customer want?",
    "options": [
      "A refund for the red shirt",
      "To exchange the red shirt for a blue one",
      "To keep both shirts",
      "To cancel the order completely"
    ],
    "answer": "To exchange the red shirt for a blue one"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Select the most professional and clear way to report a bug to a developer.",
    "options": [
      "It's broken again. Fix it.",
      "I was doing the task and the button didn't work, maybe it's the server?",
      "The 'Submit' button is unresponsive on Chrome version 90 when the form is full.",
      "I think there is a bug in the code."
    ],
    "answer": "The 'Submit' button is unresponsive on Chrome version 90 when the form is full."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Context: Verifying data. 'The address on the receipt must match the store location.' \nReceipt: '123 Main St.' \nStore Record: '123 Main Street'. \nIs this a match?",
    "options": [
      "No, 'St.' and 'Street' are different strings.",
      "Yes, because 'St.' is a standard abbreviation for 'Street'.",
      "No, the instructions say 'exactly'.",
      "It depends on the font size."
    ],
    "answer": "Yes, because 'St.' is a standard abbreviation for 'Street'."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Which sentence suggests that the speaker is offering to help, rather than asking for help?",
    "options": [
      "Could you review these files?",
      "I can review these files if you like.",
      "Do I have to review these files?",
      "Have you reviewed these files?"
    ],
    "answer": "I can review these files if you like."
  },
  {
    "type": "mcq",
    "duration": 50,
    "prompt": "Identify the sentence where the meaning is 'The task was completed very recently'.",
    "options": [
      "I completed the task yesterday.",
      "I have just completed the task.",
      "I had completed the task before the meeting.",
      "I am completing the task now."
    ],
    "answer": "I have just completed the task."
  },
  {
    "type": "mcq",
    "duration": 55,
    "prompt": "Logical Reasoning: 'Only tasks with a confidence score above 80% are sent to the client. Task A has a score of 75%. Task B has a score of 82%.' What happens?",
    "options": [
      "Both tasks are sent to the client.",
      "Only Task A is sent to the client.",
      "Only Task B is sent to the client.",
      "Neither task is sent to the client."
    ],
    "answer": "Only Task B is sent to the client."
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "Which word implies that a rule cannot be changed?",
    "options": [
      "Flexible",
      "Tentative",
      "Suggested",
      "Strict"
    ],
    "answer": "Strict"
  },
  {
    "type": "mcq",
    "duration": 55,
    "prompt": "Guideline: 'If a user's search query could mean two things, choose the most popular meaning.'\n\nScenario: A user searches for 'Apple'. The two meanings are 'the fruit' (less popular) and 'the technology company' (more popular). \n\nWhat should you show the user?",
    "options": [
      "Information about the fruit.",
      "Information about the technology company.",
      "Nothing, because the query is confusing.",
      "Ask the user to search again."
    ],
    "answer": "Information about the technology company."
  },
  {
    "type": "mcq",
    "duration": 40,
    "prompt": "You are reading a confusing instruction. What is the best clarification question to ask?",
    "options": [
      "This is bad.",
      "Can you explain what constitutes a 'low quality' image?",
      "How do I do this?",
      "Why are there so many rules?"
    ],
    "answer": "Can you explain what constitutes a 'low quality' image?"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "A prompt asks: 'Generate a creative story about a robot.' Which response fails the 'creative' requirement?",
    "options": [
      "A story about a robot who wants to become a chef.",
      "A poem about a robot falling in love with a toaster.",
      "A definition of what a robot is and how it functions.",
      "A mystery involving a robot detective."
    ],
    "answer": "A definition of what a robot is and how it functions."
  },
  {
    "type": "mcq",
    "duration": 40,
    "prompt": "Select the sentence that indicates a hypothetical situation.",
    "options": [
      "If the image loads, label it.",
      "When the image loads, label it.",
      "If the image were to fail loading, we would skip it.",
      "The image loaded, so we labeled it."
    ],
    "answer": "If the image were to fail loading, we would skip it."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Instructions: 'Prioritize accuracy over speed.' A worker rushes and makes mistakes. How would you describe their performance?",
    "options": [
      "Efficient and compliant.",
      "Fast but non-compliant with the priority rule.",
      "Slow and accurate.",
      "Excellent."
    ],
    "answer": "Fast but non-compliant with the priority rule."
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "Which phrase is used to introduce an exception to a rule?",
    "options": [
      "For example...",
      "In addition...",
      "Unless...",
      "Therefore..."
    ],
    "answer": "Unless..."
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "You see the term 'N/A' in a data field. What does this usually stand for?",
    "options": [
      "New Assignment",
      "Not Applicable",
      "No Action",
      "Next Available"
    ],
    "answer": "Not Applicable"
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "Choose the correct phrasing for a warning.",
    "options": [
      "Please carefully delete files.",
      "Be careful not to delete essential files.",
      "You might maybe delete files.",
      "Deleting files is something you do."
    ],
    "answer": "Be careful not to delete essential files."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Instruction: 'Flag the comment if it contains PII (Personally Identifiable Information).' Comment: 'Contact me at john.doe@email.com for details.'",
    "options": [
      "Flag it, because it contains an email address.",
      "Do not flag it, names are public.",
      "Flag it only if the email looks fake.",
      "Do not flag it, this is not PII."
    ],
    "answer": "Flag it, because it contains an email address."
  },
  {
    "type": "mcq",
    "duration": 40,
    "prompt": "What does 'verbatim' mean in transcription instructions?",
    "options": [
      "Summarize the main points.",
      "Correct the grammar.",
      "Type every word exactly as spoken.",
      "Remove filler words like 'um' and 'ah'."
    ],
    "answer": "Type every word exactly as spoken."
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "Which sentence implies the worker has a choice?",
    "options": [
      "You must submit the report by 5 PM.",
      "You are required to submit the report by 5 PM.",
      "You may submit the report early if you finish.",
      "Submitting the report is mandatory."
    ],
    "answer": "You may submit the report early if you finish."
  },
  {
    "type": "mcq",
    "duration": 30,
    "prompt": "Select the sentence that clearly explains *why* the task was rejected.",
    "options": [
      "The task was rejected because it contained too many errors.",
      "The task contained errors because it was rejected.",
      "The task was rejected, so it had errors.",
      "Errors were contained in the task, therefore rejection happened."
    ],
    "answer": "The task was rejected because it contained too many errors."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Select the correct connector: 'The guidelines are complex; ________, we have provided a cheat sheet.'",
    "options": [
      "nevertheless",
      "because",
      "therefore",
      "despite"
    ],
    "answer": "therefore"
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "In the sentence 'Ensure the bounding box encompasses the entire object', what does 'encompasses' mean?",
    "options": [
      "Touches",
      "Surrounds/Includes",
      "Points to",
      "Excludes"
    ],
    "answer": "Surrounds/Includes"
  },
  {
    "type": "mcq",
    "duration": 35,
    "prompt": "Which error message indicates an issue with your internet connection?",
    "options": [
      "Computer not turning on",
      "Invalid Password",
      "Network Timeout",
      "Disk Full"
    ],
    "answer": "Network Timeout"
  },
  {
    "type": "mcq",
    "duration": 40,
    "prompt": "A client asks for 'high throughput' on a task. What do they want?",
    "options": [
      "Very detailed comments.",
      "A large volume of tasks completed quickly.",
      "High accuracy only.",
      "Working only on weekends."
    ],
    "answer": "A large volume of tasks completed quickly."
  },
  {
    "type": "mcq",
    "duration": 25,
    "prompt": "Choose the correct sentence.",
    "options": [
      "The data are processed every night.",
      "The data's processed every night.",
      "The data is processed every night.",
      "Both B and C are acceptable in modern English."
    ],
    "answer": "The data is processed every night."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "Instruction: 'Do not transcribe filler words.' \nAudio: 'Um, I think, uh, we should go.' \nWhat is the correct transcription?",
    "options": [
      "I think we should go.",
      "Um, I think, uh, we should go.",
      "I think, uh, we should go.",
      "Um I think we should go."
    ],
    "answer": "I think we should go."
  },
  {
    "type": "mcq",
    "duration": 45,
    "prompt": "What does the following sentence imply? 'I would have finished the task if the internet hadn't cut out.'",
    "options": [
      "I did not finish the task because the internet cut out.",
      "I finished the task despite the internet cutting out.",
      "I will finish the task when the internet comes back.",
      "I finished the task before the internet cut out."
    ],
    "answer": "I did not finish the task because the internet cut out."
  },
  {
    "type": "reading",
    "duration": 60,
    "passage": [
      "Rule: If a user query is about 'Sports', categorize it as 'Entertainment'.",
      "Exception: If the query is about 'Sports Injury Treatment', categorize it as 'Health'.",
      "Query: 'Best exercises for recovering from a torn ACL (knee injury).'"
    ],
    "prompt": "How should you categorize this query?",
    "options": [
      "Health",
      "Entertainment",
      "Sports",
      "Fitness"
    ],
    "answer": "Health"
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Hierarchy of Needs in Search:",
      "1. Safety (Remove harmful content)",
      "2. Utility (Answer the user's question)",
      "3. Efficiency (Answer quickly)",
      "Scenario: A user searches for 'How to make poison'. The result provides a quick and accurate recipe."
    ],
    "prompt": "Based on the hierarchy, should this result be kept? Justify your answer.",
    "options": [
      "Yes, because it meets the Utility need.",
      "No, because Safety is the top priority and the content is harmful.",
      "Yes, because it is efficient.",
      "No, because the recipe might be inaccurate."
    ],
    "answer": "No, because Safety is the top priority and the content is harmful."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Invoice Processing Guide:",
      "If the invoice amount is under $500, approve it automatically. If it is between $500 and $1000, send it to the Manager. If it is over $1000, send it to the Director. EXCEPTION: All invoices from 'Vendor X' must go to the Director regardless of amount."
    ],
    "prompt": "You receive an invoice for $200 from Vendor X. What is the correct action?",
    "options": [
      "Approve automatically (Under $500).",
      "Send to Manager (Vendor exception).",
      "Send to Director (Vendor exception).",
      "Reject the invoice."
    ],
    "answer": "Send to Director (Vendor exception)."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Guidelines for 'Blurry' Tag:",
      "Text A: 'Mark an image as blurry if the main subject is out of focus.'",
      "Text B (Update): 'Do not mark an image as blurry if the blur is artistic (e.g., background bokeh). Only mark it if the subject itself is unrecognizable due to motion blur or poor focus.'"
    ],
    "prompt": "An image shows a sharp, clear portrait of a person with a very blurry background. Based on the *Update*, how should you tag it?",
    "options": [
      "Mark as Blurry because the background is out of focus.",
      "Do not mark as Blurry because the subject is sharp.",
      "Mark as Blurry because Text A says so.",
      "Mark as Unrecognizable."
    ],
    "answer": "Do not mark as Blurry because the subject is sharp."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Chatbot Persona: Helpful & Concise.",
      "The bot should provide direct answers. It should avoid conversational filler (e.g., 'That is a great question!', 'I hope you are having a nice day'). It should simple bullet points for lists."
    ],
    "prompt": "User: 'What are the ingredients for a cake?' Select the best bot response.",
    "options": [
      "That is a yummy question! You need flour, sugar, and eggs.",
      "- Flour\n- Sugar\n- Eggs\n- Butter",
      "I hope you are hungry. To make a cake, you generally require flour, sugar...",
      "Baking is a science. You need precision with flour and sugar."
    ],
    "answer": "- Flour\n- Sugar\n- Eggs\n- Butter"
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Escalation Policy:",
      "Level 1 agents handle password resets. Level 2 agents handle billing disputes. Level 3 agents handle technical bugs. If a user has multiple issues, escalate to the highest level required."
    ],
    "prompt": "A user needs a password reset and has a billing dispute. Who handles this?",
    "options": [
      "Level 1 Agent",
      "Level 2 Agent",
      "Level 3 Agent",
      "The user must call twice."
    ],
    "answer": "Level 2 Agent"
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Audio Transcription - Foreign Language:",
      "If you hear a language other than English:",
      "1. If it is the primary language of the clip, mark [Foreign].",
      "2. If it is just a few words in an English sentence, transcribe the English and tag the foreign words as [Foreign_Speech].",
      "3. Proper nouns (like 'Tokyo' or 'Burrito') are NOT considered foreign language."
    ],
    "prompt": "Audio: 'I loved the trip to Paris.' (The word 'Paris' is spoken with a French accent). What do you transcribe?",
    "options": [
      "I loved the trip to [Foreign_Speech].",
      "I loved the trip to [Foreign].",
      "I loved the trip to Paris.",
      "[Foreign]"
    ],
    "answer": "I loved the trip to Paris."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Map Annotation:",
      "Draw a polygon around the building. Include the roof and any visible awnings. Do NOT include the shadow of the building. Do NOT include driveways."
    ],
    "prompt": "The worker drew a polygon that included the roof, the awning, and the shadow on the ground. Why is this incorrect?",
    "options": [
      "They missed the driveway.",
      "They included the shadow.",
      "They included the awning.",
      "They drew a polygon instead of a box."
    ],
    "answer": "They included the shadow."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Urgency Codes:",
      "Code Red: System outage.",
      "Code Orange: Feature malfunction affecting >50% users.",
      "Code Yellow: Feature malfunction affecting <50% users.",
      "Code Blue: Cosmetic issue (typos, colors)."
    ],
    "prompt": "A misspelling is found on the login page. What code is this?",
    "options": [
      "Code Red",
      "Code Orange",
      "Code Yellow",
      "Code Blue"
    ],
    "answer": "Code Blue"
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Two-Step Verification:",
      "Step 1: Check if the email address is valid.",
      "Step 2: If valid, check if the domain is 'company.com'.",
      "Instructions: If Step 1 fails, mark 'Invalid Email'. If Step 1 passes but Step 2 fails, mark 'External User'. If both pass, mark 'Internal User'."
    ],
    "prompt": "Email: 'john@gmail.com' (Valid email format). How do you mark it?",
    "options": [
      "Invalid Email",
      "External User",
      "Internal User",
      "Company User"
    ],
    "answer": "External User"
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Summary Task:",
      "Original Text: 'The battery life of the device is significantly lower than advertised, lasting only 4 hours instead of 10. Consequently, many users are returning the product.'",
      "Task: Select the most accurate summary."
    ],
    "prompt": "Which option best summarizes the text?",
    "options": [
      "Users are returning the device because the battery life is much shorter than promised.",
      "The device lasts 10 hours, which is great for users.",
      "The battery life is advertised as 4 hours.",
      "Users dislike the product due to its color."
    ],
    "answer": "Users are returning the device because the battery life is much shorter than promised."
  },
  {
    "type": "reading",
    "duration": 85,
    "passage": [
      "Content Moderation - Satire:",
      "Satire (humor/exaggeration to criticize) is ALLOWED. Disinformation (false claims intended to deceive) is BANNED.",
      "Post: A clearly photoshopped image of a cat running for President with the caption 'Mr. Whiskers promises free tuna for all!'"
    ],
    "prompt": "How should this post be moderated?",
    "options": [
      "Ban it as Disinformation (cats cannot be President).",
      "Allow it as Satire.",
      "Ban it as Political Content.",
      "Allow it as News."
    ],
    "answer": "Allow it as Satire."
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

  const mcqBank = masterBank.filter(q => q.type === "mcq");
  const readingBank = masterBank.filter(q => q.type === "reading");

  const selectedMCQ = shuffleArray(mcqBank).slice(0, 15);
  const selectedReading = shuffleArray(readingBank).slice(0, 5);

  questions.value = shuffleArray([...selectedMCQ, ...selectedReading]);

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
  if (pct < 74)
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

// Minimum questions required to prevent skip exploit
const MIN_QUESTIONS_TO_PASS = 15;
// Require at least 75% (15/20) to pass
const passed = computed(() =>
  phase.value === "result" &&
  questions.value.length >= MIN_QUESTIONS_TO_PASS &&
  score.value >= Math.ceil(questions.value.length * 0.75)
);
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