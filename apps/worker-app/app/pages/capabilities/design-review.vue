<template>
  <div class="dr-test">
    <AwardCapability :capability="capability" v-if="showAward" />

    <h2 class="text-xl my-6 text-center">Design Review Test (8-12min)</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>
        This test checks whether you notice blatant mistakes in a design while
        you are giving feedback on it.
      </p>
      <br>
      <p>
        Canva feedback tasks ask you for a score and an optional critique. That
        makes them feel like a survey, so it is easy to rate a design and move
        on. But a requester is about to publish these designs. A misspelled
        headline or a price that contradicts the small print costs them far more
        than a low score does, and you are the last person who sees the design
        before it goes out.
      </p>
      <br>
      <p>The test consists of <strong>15 questions</strong> covering:</p>
      <ul class="bullets">
        <li><strong>- What Belongs In Your Feedback</strong></li>
        <li><strong>- Spelling, Typos & Doubled Words</strong></li>
        <li><strong>- Grammar & Wrong Word Choice</strong></li>
        <li><strong>- Numbers, Prices & Discounts That Do Not Add Up</strong></li>
        <li><strong>- Dates, Times & Details That Contradict Each Other</strong></li>
        <li><strong>- Clean Designs: Not Inventing Problems</strong></li>
        <li><strong>- Useful Feedback vs Filler</strong></li>
      </ul>
      <p>Please note the following rules:</p>
      <ul class="bullets">
        <li><strong>Mistakes, Not Taste:</strong> Only flag things that are objectively wrong. Colours, fonts and layout preferences are not mistakes.</li>
        <li><strong>Clean Designs Exist:</strong> Some designs have nothing wrong with them. Saying so is the correct answer, and inventing a fault is scored as an error.</li>
        <li><strong>Timed Questions:</strong> Each question has a countdown timer. If time runs out, your current answer will be automatically submitted.</li>
        <li><strong>Forward Only:</strong> Once you submit a question, you cannot return to it.</li>
        <li><strong>Different Every Attempt:</strong> Your 15 questions are drawn from a larger bank, with every category above represented each time.</li>
      </ul>
      <br>
      <p><strong>Passing Score:</strong> You need at least <strong>11 of 15</strong> correct to pass.</p>
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
        <div v-if="current.brief" class="brief">
          <div class="brief-item" v-if="current.brief.purpose">
            <div class="brief-label">Purpose</div>
            <div>{{ current.brief.purpose }}</div>
          </div>
          <div class="brief-item" v-if="current.brief.audience">
            <div class="brief-label">Audience</div>
            <div>{{ current.brief.audience }}</div>
          </div>
        </div>

        <div
          v-if="current.design"
          class="design-canvas"
          :class="'theme-' + current.design.theme"
        >
          <template
            v-for="(block, blockIndex) in current.design.blocks"
            :key="blockIndex"
          >
            <p v-if="block.type === 'eyebrow'" class="d-eyebrow">{{ block.text }}</p>
            <h3 v-else-if="block.type === 'headline'" class="d-headline">{{ block.text }}</h3>
            <p v-else-if="block.type === 'subhead'" class="d-subhead">{{ block.text }}</p>
            <p v-else-if="block.type === 'body'" class="d-body">{{ block.text }}</p>
            <ul v-else-if="block.type === 'list'" class="d-list">
              <li v-for="(listItem, listIndex) in block.items" :key="listIndex">
                {{ listItem }}
              </li>
            </ul>
            <div v-else-if="block.type === 'rows'" class="d-rows">
              <div
                v-for="(row, rowIndex) in block.rows"
                :key="rowIndex"
                class="d-row"
              >
                <span>{{ row.label }}</span>
                <span>{{ row.value }}</span>
              </div>
            </div>
            <div v-else-if="block.type === 'price'" class="d-price">
              <span v-if="block.was" class="d-price-was">{{ block.was }}</span>
              <span class="d-price-now">{{ block.now }}</span>
            </div>
            <div v-else-if="block.type === 'cta'" class="d-cta-wrap">
              <span class="d-cta">{{ block.text }}</span>
            </div>
            <p v-else-if="block.type === 'footnote'" class="d-footnote">{{ block.text }}</p>
          </template>
        </div>

        <div v-if="current.quote" class="quote">
          <div class="quote-label">Worker feedback</div>
          <p>“{{ current.quote }}”</p>
        </div>

        <div class="qtext" v-html="current.prompt"></div>

        <div v-if="current.type === 'mcq'" class="options">
          <label v-for="option in currentOptions" :key="option" class="opt">
            <input
              type="radio"
              :name="'q' + index"
              :value="option"
              v-model="answers[index]"
            />
            <span>{{ option }}</span>
          </label>
        </div>
      </div>

      <div class="nav right-align">
        <span v-if="answers[index] === null" class="pick-hint">
          Select an answer to continue
        </span>
        <button
          class="btn primary"
          @click="next"
          :disabled="transitioning || answers[index] === null"
        >
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

// Every "spot the mistake" question offers this as its last option. It is the
// correct answer on the clean designs, which catches workers who assume there
// is always something wrong and invent a fault to look thorough.
const NO_ISSUES = "No issues to flag, the design is ready to publish";

const QUESTION_COUNT = 15;
const PASS_MARK = 11;

// Each attempt draws a fresh set from the larger bank. The quotas keep every
// category represented, so no run can happen to skip the clean designs or the
// feedback questions, and a worker on their second attempt does not see the
// same 15 questions again.
const SECTION_QUOTAS = {
  "Feedback scope": 1,
  "Spelling & typos": 3,
  "Grammar & word choice": 2,
  "Numbers that don't add up": 2,
  "Contradictory details": 3,
  "Clean designs": 2,
  "Feedback quality": 2,
};

const masterBank = [
  // What Belongs In Your Feedback
  {
    "type": "mcq",
    "section": "Feedback scope",
    "duration": 45,
    "prompt": "A Canva feedback task asks only for a clarity score from 1 to 10. While looking at the design you notice the headline reads <strong>\"Recieve 20% Off\"</strong>. What should you do?",
    "options": [
      "Give the clarity score and describe the misspelled headline in the feedback box",
      "Give the clarity score only, because spelling was not what the task asked about",
      "Score the design 1 out of 10 and leave the feedback box empty",
      "Skip the task so that another worker reports it"
    ],
    "answer": "Give the clarity score and describe the misspelled headline in the feedback box"
  },
  {
    "type": "mcq",
    "section": "Feedback scope",
    "duration": 45,
    "prompt": "Which of these belongs in your feedback as a mistake the requester has to fix, rather than as a matter of taste?",
    "options": [
      "The price in the headline does not match the price in the small print",
      "The background gradient is not a colour I would have chosen",
      "The photo would work better with a person in it",
      "A bolder font would suit a younger audience"
    ],
    "answer": "The price in the headline does not match the price in the small print"
  },

  // Spelling, Typos & Doubled Words
  {
    "type": "mcq",
    "section": "Spelling & typos",
    "duration": 60,
    "brief": {
      "purpose": "Promote a three day summer sale",
      "audience": "Existing customers on the mailing list"
    },
    "design": {
      "theme": "sunset",
      "blocks": [
        { "type": "eyebrow", "text": "MIDSUMMER SALE" },
        { "type": "headline", "text": "Up To 30% Off Everthing" },
        { "type": "subhead", "text": "Three days only, in store and online" },
        { "type": "cta", "text": "Shop Now" },
        { "type": "footnote", "text": "Offer ends 30 June." }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "\"Everthing\" in the headline is missing a letter",
      "The call to action button could be larger",
      "\"Three days only\" would read better as \"3 days only\"",
      NO_ISSUES
    ],
    "answer": "\"Everthing\" in the headline is missing a letter"
  },
  {
    "type": "mcq",
    "section": "Spelling & typos",
    "duration": 60,
    "design": {
      "theme": "ink",
      "blocks": [
        { "type": "eyebrow", "text": "FREE WEBINAR" },
        { "type": "headline", "text": "Scaling Your Startup" },
        { "type": "subhead", "text": "Join us for a a live session with three founders" },
        { "type": "rows", "rows": [
          { "label": "Date", "value": "Thursday 14 May" },
          { "label": "Time", "value": "6:00 PM CET" }
        ] },
        { "type": "cta", "text": "Save My Seat" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The subhead contains a doubled word: \"a a live session\"",
      "\"Startup\" would be clearer written as two words",
      "The date would look neater above the time",
      NO_ISSUES
    ],
    "answer": "The subhead contains a doubled word: \"a a live session\""
  },
  {
    "type": "mcq",
    "section": "Spelling & typos",
    "duration": 60,
    "design": {
      "theme": "berry",
      "blocks": [
        { "type": "eyebrow", "text": "NEW YEAR, NEW YOU" },
        { "type": "headline", "text": "Grand Openng" },
        { "type": "subhead", "text": "Free day passes all week" },
        { "type": "cta", "text": "Claim A Pass" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline is missing a letter: \"Openng\"",
      "The eyebrow line is a cliché and could be reworded",
      "The button colour is too close to the background",
      NO_ISSUES
    ],
    "answer": "The headline is missing a letter: \"Openng\""
  },
  {
    "type": "mcq",
    "section": "Spelling & typos",
    "duration": 60,
    "design": {
      "theme": "mint",
      "blocks": [
        { "type": "eyebrow", "text": "AUTUMN BREAKS" },
        { "type": "headline", "text": "Three Nights By The Sea" },
        { "type": "body", "text": "Accomodation, breakfast and parking included." },
        { "type": "price", "was": "", "now": "From €249" },
        { "type": "cta", "text": "Book Now" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "\"Accomodation\" is misspelled and needs a second \"m\"",
      "The headline could name the resort",
      "The price would stand out more in a larger size",
      NO_ISSUES
    ],
    "answer": "\"Accomodation\" is misspelled and needs a second \"m\""
  },
  {
    "type": "mcq",
    "section": "Spelling & typos",
    "duration": 60,
    "design": {
      "theme": "slate",
      "blocks": [
        { "type": "eyebrow", "text": "SIX WEEK CHALLENGE" },
        { "type": "headline", "text": "Loose 5kg In Six Weeks" },
        { "type": "subhead", "text": "Coached sessions three times a week" },
        { "type": "price", "was": "£120", "now": "£89" },
        { "type": "cta", "text": "Join The Challenge" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline should read \"Lose 5kg\", not \"Loose\"",
      "The old price would be more convincing as a monthly figure",
      "The eyebrow line repeats the headline",
      NO_ISSUES
    ],
    "answer": "The headline should read \"Lose 5kg\", not \"Loose\""
  },

  // Grammar & Wrong Word Choice
  {
    "type": "mcq",
    "section": "Grammar & word choice",
    "duration": 60,
    "brief": {
      "purpose": "Invite neighbours to a studio opening",
      "audience": "Local residents"
    },
    "design": {
      "theme": "coral",
      "blocks": [
        { "type": "eyebrow", "text": "OPENING NIGHT" },
        { "type": "headline", "text": "Your Invited!" },
        { "type": "subhead", "text": "Grand opening of our new studio" },
        { "type": "rows", "rows": [
          { "label": "Where", "value": "42 Kingsway, Leeds" },
          { "label": "When", "value": "Saturday 6 September, 7 PM" }
        ] },
        { "type": "cta", "text": "RSVP By 1 September" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline should read \"You're Invited\"",
      "The exclamation mark in the headline is unnecessary",
      "The address would sit better above the date",
      NO_ISSUES
    ],
    "answer": "The headline should read \"You're Invited\""
  },
  {
    "type": "mcq",
    "section": "Grammar & word choice",
    "duration": 60,
    "design": {
      "theme": "cream",
      "blocks": [
        { "type": "eyebrow", "text": "WE'VE MOVED" },
        { "type": "headline", "text": "Same Coffee, New Home" },
        { "type": "body", "text": "Come and see the cafe in it's new location on Bridge Street." },
        { "type": "footnote", "text": "Open from Monday 3 March." }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "\"it's\" in the body text should be \"its\"",
      "\"cafe\" would look better written with an accent",
      "The footnote would work better as a subhead",
      NO_ISSUES
    ],
    "answer": "\"it's\" in the body text should be \"its\""
  },
  {
    "type": "mcq",
    "section": "Grammar & word choice",
    "duration": 60,
    "design": {
      "theme": "coral",
      "blocks": [
        { "type": "eyebrow", "text": "NOW HIRING" },
        { "type": "headline", "text": "Join Our Kitchen Team" },
        { "type": "body", "text": "Their are two positions open in our Bristol kitchen." },
        { "type": "cta", "text": "Apply In Person" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "\"Their are\" should be \"There are\"",
      "The city name would be better placed in the headline",
      "\"Apply In Person\" would sound friendlier in lower case",
      NO_ISSUES
    ],
    "answer": "\"Their are\" should be \"There are\""
  },
  {
    "type": "mcq",
    "section": "Grammar & word choice",
    "duration": 60,
    "design": {
      "theme": "mint",
      "blocks": [
        { "type": "eyebrow", "text": "WEEKEND MARKET" },
        { "type": "headline", "text": "Fresh Produce Every Weekend" },
        { "type": "list", "items": [
          "Open Sunday's from 8 AM",
          "Free parking behind the hall",
          "Card and cash accepted"
        ] }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "\"Sunday's\" is a possessive and should be \"Sundays\"",
      "The list would read better as full sentences",
      "\"Card and cash accepted\" would sound warmer as \"We accept card and cash\"",
      NO_ISSUES
    ],
    "answer": "\"Sunday's\" is a possessive and should be \"Sundays\""
  },

  // Numbers, Prices & Discounts That Do Not Add Up
  {
    "type": "mcq",
    "section": "Numbers that don't add up",
    "duration": 60,
    "brief": {
      "purpose": "Advertise a clearance discount",
      "audience": "Bargain hunters browsing in store"
    },
    "design": {
      "theme": "sunset",
      "blocks": [
        { "type": "eyebrow", "text": "CLEARANCE" },
        { "type": "headline", "text": "Save 50%" },
        { "type": "price", "was": "$80", "now": "$45" },
        { "type": "footnote", "text": "While stocks last." }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "$80 down to $45 is a 44% saving, so the headline overstates the discount",
      "The old price should be printed smaller than the new one",
      "\"While stocks last\" is an overused phrase",
      NO_ISSUES
    ],
    "answer": "$80 down to $45 is a 44% saving, so the headline overstates the discount"
  },
  {
    "type": "mcq",
    "section": "Numbers that don't add up",
    "duration": 60,
    "design": {
      "theme": "mint",
      "blocks": [
        { "type": "eyebrow", "text": "POTTERY CLASSES" },
        { "type": "headline", "text": "Six Weeks For £60" },
        { "type": "rows", "rows": [
          { "label": "Single class", "value": "£12" },
          { "label": "Six week course", "value": "£72" }
        ] },
        { "type": "cta", "text": "Reserve A Wheel" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline says £60 but the course is listed at £72",
      "\"Six\" would be punchier written as the numeral 6",
      "The class times could be shown in a larger font",
      NO_ISSUES
    ],
    "answer": "The headline says £60 but the course is listed at £72"
  },
  {
    "type": "mcq",
    "section": "Numbers that don't add up",
    "duration": 60,
    "design": {
      "theme": "cream",
      "blocks": [
        { "type": "eyebrow", "text": "HOW IT WORKS" },
        { "type": "headline", "text": "Three Easy Steps" },
        { "type": "list", "items": [
          "1. Book your slot online",
          "2. Bring your ID on the day"
        ] },
        { "type": "cta", "text": "Book Online" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline promises three steps but only two are listed",
      "The steps would look better without the numbers",
      "\"Book Online\" repeats wording already used in step one",
      NO_ISSUES
    ],
    "answer": "The headline promises three steps but only two are listed"
  },

  // Dates, Times & Details That Contradict Each Other
  {
    "type": "mcq",
    "section": "Contradictory details",
    "duration": 60,
    "design": {
      "theme": "ink",
      "blocks": [
        { "type": "eyebrow", "text": "LIVE AT THE VAULT" },
        { "type": "headline", "text": "The Northern Lights Tour" },
        { "type": "rows", "rows": [
          { "label": "Doors", "value": "8:00 PM" },
          { "label": "Support act", "value": "7:15 PM" },
          { "label": "Main set", "value": "9:00 PM" }
        ] },
        { "type": "cta", "text": "Tickets From £22" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The support act is listed before the doors open",
      "The times would look neater in 24 hour format",
      "The tour name could be set larger than the venue name",
      NO_ISSUES
    ],
    "answer": "The support act is listed before the doors open"
  },
  {
    "type": "mcq",
    "section": "Contradictory details",
    "duration": 60,
    "brief": {
      "purpose": "Drive entries to a photo competition",
      "audience": "Amateur photographers"
    },
    "design": {
      "theme": "berry",
      "blocks": [
        { "type": "eyebrow", "text": "PHOTO COMPETITION" },
        { "type": "headline", "text": "Win A Weekend In Lisbon" },
        { "type": "rows", "rows": [
          { "label": "Entries close", "value": "12 October" },
          { "label": "Winner announced", "value": "5 October" }
        ] },
        { "type": "cta", "text": "Enter Now" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The winner is announced before entries close",
      "The prize would sound better as \"Two Nights In Lisbon\"",
      "The entry rules would fit better on the back of the flyer",
      NO_ISSUES
    ],
    "answer": "The winner is announced before entries close"
  },
  {
    "type": "mcq",
    "section": "Contradictory details",
    "duration": 60,
    "design": {
      "theme": "slate",
      "blocks": [
        { "type": "eyebrow", "text": "NOW OPEN" },
        { "type": "headline", "text": "Open Seven Days A Week" },
        { "type": "rows", "rows": [
          { "label": "Mon to Fri", "value": "9 AM to 6 PM" },
          { "label": "Saturday", "value": "10 AM to 4 PM" },
          { "label": "Sunday", "value": "Closed" }
        ] }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline says seven days but the hours show Sunday closed",
      "The opening hours would look better centred",
      "\"Now Open\" repeats the idea of the headline",
      NO_ISSUES
    ],
    "answer": "The headline says seven days but the hours show Sunday closed"
  },
  {
    "type": "mcq",
    "section": "Contradictory details",
    "duration": 60,
    "design": {
      "theme": "coral",
      "blocks": [
        { "type": "eyebrow", "text": "ONLINE STORE" },
        { "type": "headline", "text": "Order By 6 PM For Next Day Delivery" },
        { "type": "body", "text": "Browse the new range at shop.example.com" },
        { "type": "footnote", "text": "Free returns within 30 days at store.example.com" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The design gives two different web addresses",
      "The headline is long and could be split over two lines",
      "The web address would stand out more in capitals",
      NO_ISSUES
    ],
    "answer": "The design gives two different web addresses"
  },

  // Clean Designs: Not Inventing Problems
  {
    "type": "mcq",
    "section": "Clean designs",
    "duration": 60,
    "brief": {
      "purpose": "Announce a weekly farmers market",
      "audience": "Families living nearby"
    },
    "design": {
      "theme": "cream",
      "blocks": [
        { "type": "eyebrow", "text": "RIVERSIDE FARMERS MARKET" },
        { "type": "headline", "text": "Every Saturday, 8 AM To 2 PM" },
        { "type": "subhead", "text": "Bread, cheese, flowers and coffee from twenty local growers" },
        { "type": "footnote", "text": "Riverside Car Park, off Mill Lane." }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The headline and the footnote contradict each other",
      "\"Saturday\" is misspelled",
      "The number of growers does not match the list of goods",
      NO_ISSUES
    ],
    "answer": NO_ISSUES
  },
  {
    "type": "mcq",
    "section": "Clean designs",
    "duration": 60,
    "design": {
      "theme": "ink",
      "blocks": [
        { "type": "eyebrow", "text": "ONLINE WORKSHOP" },
        { "type": "headline", "text": "Better Slides In One Evening" },
        { "type": "rows", "rows": [
          { "label": "Doors", "value": "6:30 PM" },
          { "label": "Talk", "value": "7:00 PM" },
          { "label": "Questions", "value": "7:45 PM" }
        ] },
        { "type": "cta", "text": "Register Free" }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The questions session is listed before the talk",
      "\"Register\" is misspelled on the button",
      "The headline promises an evening but the times run all day",
      NO_ISSUES
    ],
    "answer": NO_ISSUES
  },
  {
    "type": "mcq",
    "section": "Clean designs",
    "duration": 60,
    "design": {
      "theme": "sunset",
      "blocks": [
        { "type": "eyebrow", "text": "END OF SEASON" },
        { "type": "headline", "text": "Save 50%" },
        { "type": "price", "was": "$80", "now": "$40" },
        { "type": "footnote", "text": "Sale ends Sunday." }
      ]
    },
    "prompt": "The requester asked for a clarity score. Which mistake must you flag in your feedback?",
    "options": [
      "The saving does not match the two prices shown",
      "\"Season\" is misspelled in the eyebrow line",
      "The footnote contradicts the headline",
      NO_ISSUES
    ],
    "answer": NO_ISSUES
  },

  // Useful Feedback vs Filler
  {
    "type": "mcq",
    "section": "Feedback quality",
    "duration": 45,
    "design": {
      "theme": "berry",
      "blocks": [
        { "type": "eyebrow", "text": "SPRING COURSES" },
        { "type": "headline", "text": "Learn To Sail This Spring" },
        { "type": "subhead", "text": "Eight lessons on the harbour, all equipment provided" },
        { "type": "cta", "text": "Regsiter Now" }
      ]
    },
    "prompt": "Four workers reviewed this design. Which feedback is most useful to the requester?",
    "options": [
      "\"The button reads 'Regsiter Now' instead of 'Register Now'. Everything else is clear.\"",
      "\"Nice design, 9 out of 10.\"",
      "\"Something feels off near the bottom of the design.\"",
      "\"I would change the colours.\""
    ],
    "answer": "\"The button reads 'Regsiter Now' instead of 'Register Now'. Everything else is clear.\""
  },
  {
    "type": "mcq",
    "section": "Feedback quality",
    "duration": 45,
    "quote": "Looks great!",
    "prompt": "A worker scored a design 9 out of 10 and left the feedback above. The design's headline reads <strong>\"Free Delivery On All Order\"</strong>. Why is that submission a problem?",
    "options": [
      "It hides a mistake the requester would want to fix before publishing",
      "The score was too high for a design of this quality",
      "Feedback has to be at least three sentences long",
      "Scores above 8 are not allowed without a critique"
    ],
    "answer": "It hides a mistake the requester would want to fix before publishing"
  },
  {
    "type": "mcq",
    "section": "Feedback quality",
    "duration": 45,
    "quote": "The date is wrong.",
    "prompt": "A worker spotted that a poster shows 5 May in the footer and 6 May in the headline, and wrote the feedback above. What would make that feedback more useful?",
    "options": [
      "Name both dates and say where each one appears, so the requester can find them",
      "Add a sentence saying the task was enjoyable",
      "Repeat the same point in different words to make the feedback longer",
      "Drop the comment and give a low score instead"
    ],
    "answer": "Name both dates and say where each one appears, so the requester can find them"
  }
];

const current = computed(() => questions.value[index.value]);

// Options are shuffled so that the position of the correct answer carries no
// signal, but "no issues" always stays last: workers should read it as the
// closing verdict, not stumble on it halfway down the list.
const currentOptions = computed(() => current.value?.shuffledOptions ?? []);

function shuffleArray(array) {
  const shuffled = [...array];
  for (let position = shuffled.length - 1; position > 0; position--) {
    const target = Math.floor(Math.random() * (position + 1));
    [shuffled[position], shuffled[target]] = [shuffled[target], shuffled[position]];
  }
  return shuffled;
}

function drawQuestions() {
  const drawn = [];
  for (const section of Object.keys(SECTION_QUOTAS)) {
    const pool = masterBank.filter((question) => question.section === section);
    drawn.push(...shuffleArray(pool).slice(0, SECTION_QUOTAS[section]));
  }
  return shuffleArray(drawn).map(withShuffledOptions);
}

function withShuffledOptions(question) {
  const pinned = question.options.filter((option) => option === NO_ISSUES);
  const rest = question.options.filter((option) => option !== NO_ISSUES);
  return { ...question, shuffledOptions: [...shuffleArray(rest), ...pinned] };
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
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
}

function start() {
  // Check if user has attempts remaining before starting
  if (!hasAttemptsRemaining(capability?.id)) {
    console.warn("No attempts remaining");
    alert("You have no attempts remaining for this test.");
    return;
  }

  questions.value = drawQuestions();

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
  questions.value.reduce((sum, question, questionIndex) => {
    const given = answers.value[questionIndex];
    return sum + (given === question.answer ? 1 : 0);
  }, 0),
);

// The length check prevents passing on a truncated question set
const passed = computed(() =>
  phase.value === "result" &&
  questions.value.length >= QUESTION_COUNT &&
  score.value >= PASS_MARK
);

// How many of the clean designs the worker wrongly reported a fault on.
// Called out separately because inventing problems damages a requester's trust
// in worker feedback as much as missing a real mistake does.
const inventedFaults = computed(() =>
  questions.value.reduce((sum, question, questionIndex) => {
    if (question.answer !== NO_ISSUES) return sum;
    const given = answers.value[questionIndex];
    return sum + (given && given !== NO_ISSUES ? 1 : 0);
  }, 0),
);

const resultDescription = computed(() => {
  if (passed.value) {
    return "Congratulations! You reliably catch blatant mistakes in a design and describe them in a way a requester can act on.";
  }
  if (inventedFaults.value > 0) {
    return "You reported a fault on a design that had nothing wrong with it. Flag only what is objectively incorrect, review the guidance and try again.";
  }
  return "Review the guidance on spelling, contradictory details and useful feedback, then try again.";
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

const capability = availableCapabilities.find((entry) =>
  entry.id.startsWith("effectai/design-review"),
);
</script>

<style scoped>
  .dr-test {
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
  .brief {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    padding: 10px 12px;
    margin-bottom: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8fafc;
    font-size: 0.9rem;
    color: #334155;
  }
  .brief-label {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b;
  }
  .quote {
    border-left: 3px solid #cbd5e1;
    padding: 6px 0 6px 12px;
    margin-bottom: 12px;
    color: #334155;
    font-style: italic;
  }
  .quote-label {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b;
    font-style: normal;
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
  .pick-hint {
    align-self: center;
    font-size: 0.85rem;
    color: #64748b;
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

  /* Mock Canva-style designs, rendered in page so the planted mistakes are
     exact and the test needs no hosted images. */
  .design-canvas {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    min-height: 260px;
    padding: 28px 24px;
    margin-bottom: 14px;
    border-radius: 14px;
    text-align: center;
    font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif;
    overflow-wrap: anywhere;
  }
  .theme-sunset {
    background: linear-gradient(155deg, #ff9a3c, #ff5f6d);
    color: #fff8f2;
  }
  .theme-ink {
    background: linear-gradient(155deg, #0f172a, #1e3a8a);
    color: #e2e8f0;
  }
  .theme-mint {
    background: linear-gradient(155deg, #d1fae5, #99f6e4);
    color: #065f46;
  }
  .theme-coral {
    background: linear-gradient(155deg, #fff1f2, #fecdd3);
    color: #9f1239;
  }
  .theme-slate {
    background: linear-gradient(155deg, #e2e8f0, #cbd5e1);
    color: #0f172a;
  }
  .theme-cream {
    background: linear-gradient(155deg, #fefce8, #fde68a);
    color: #78350f;
  }
  .theme-berry {
    background: linear-gradient(155deg, #4c1d95, #be185d);
    color: #fdf4ff;
  }
  .d-eyebrow {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.85;
  }
  .d-headline {
    font-size: 2rem;
    line-height: 1.15;
    font-weight: 800;
    margin: 0;
  }
  .d-subhead {
    font-size: 1.05rem;
    max-width: 30ch;
    opacity: 0.95;
  }
  .d-body {
    font-size: 0.98rem;
    max-width: 34ch;
    opacity: 0.92;
  }
  .d-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.98rem;
    display: grid;
    gap: 6px;
  }
  .d-rows {
    width: 100%;
    max-width: 340px;
    font-size: 0.95rem;
  }
  .d-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 0;
    border-bottom: 1px dashed currentColor;
  }
  .d-row:last-child {
    border-bottom: none;
  }
  .d-price {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .d-price-was {
    font-size: 1.1rem;
    text-decoration: line-through;
    opacity: 0.7;
  }
  .d-price-now {
    font-size: 1.8rem;
    font-weight: 800;
  }
  .d-cta {
    display: inline-block;
    padding: 10px 22px;
    border: 2px solid currentColor;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    font-weight: 700;
  }
  .d-footnote {
    font-size: 0.78rem;
    opacity: 0.8;
  }
  @media (max-width: 520px) {
    .d-headline {
      font-size: 1.5rem;
    }
    .design-canvas {
      min-height: 220px;
      padding: 22px 16px;
    }
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style>
