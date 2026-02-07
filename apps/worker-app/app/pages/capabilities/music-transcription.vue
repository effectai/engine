<template>
  <div class="music-test">
    <!-- First award: Music Transcription (shown for 70%+) -->
    <AwardCapability
      :capability="transcriptionCapability"
      v-if="showTranscriptionAward"
      :autoNavigate="!earnedValidation"
      @continue="onTranscriptionAwardContinue"
    />
    <!-- Second award: Music Transcription Validation (shown for 80%+) -->
    <AwardCapability
      :capability="validationCapability"
      v-if="showValidationAward"
    />

    <h2 class="text-xl my-6 text-center">Music Transcription Verification Test</h2>

    <div v-if="phase === 'intro'" class="card">
      <p>This test assesses your ability to accurately verify music lyrics and timestamps.</p>
      <br>
      <p>The test consists of <strong>25 questions</strong>:</p>
      <ul class="bullets">
        <li><strong>- 10 Lyric Accuracy (Multiple Choice)</strong></li>
        <li><strong>- 10 Validation Scenarios (Multiple Choice)</strong></li>
        <li><strong>- 5 Fill-in-the-Blank Transcription</strong></li>
      </ul>
      <p>Please note the following rules:</p>
      <ul class="bullets">
        <li><strong>Timed Questions:</strong> Each question has a countdown timer. If time runs out, your current answer will be automatically submitted.</li>
        <li><strong>Forward Only:</strong> Once you submit a question, you cannot return to it.</li>
        <li><strong>No Copy & Paste:</strong> Copying, pasting, or cutting text is disabled for fill-in-the-blank questions.</li>
        <li><strong>Audio Playback:</strong> You can replay audio clips and adjust playback speed as needed.</li>
      </ul>
      <br>
      <p><strong>Passing Score:</strong> You need to score at least 72% (18/25 correct) to pass.</p>
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
          <span v-if="waitingForAudio" class="timer loading">
            ⏳ Loading audio...
          </span>
          <span v-else :class="['timer', { urgent: timeLeft <= 10 }]">
            ⏱ {{ formatTime(timeLeft) }}
          </span>
        </div>
      </div>

      <div class="qwrap">
        <div class="qtext" v-html="current.prompt"></div>

        <!-- Lyric Accuracy MCQ -->
        <div v-if="current.type === 'lyric-mcq'">
          <div class="audio-player" v-if="current.audioUrl">
            <audio
              ref="audioPlayer"
              :src="current.audioUrl"
              preload="auto"
              @loadedmetadata="onAudioLoaded"
              @timeupdate="onTimeUpdate"
              @error="onAudioError"
              @waiting="onAudioWaiting"
              @playing="onAudioPlaying"
            ></audio>
            <div class="audio-controls">
              <button class="btn" @click="replayAudio" :disabled="audioLoading || audioBuffering">
                {{ audioBuffering ? '⏳ Buffering...' : '🔄 Replay' }}
              </button>
              <div class="speed-controls">
                <button @click="changePlaySpeed(0.75)" class="btn speed-btn" :class="{ active: playbackRate === 0.75 }">0.75x</button>
                <button @click="changePlaySpeed(1)" class="btn speed-btn" :class="{ active: playbackRate === 1 }">1x</button>
                <button @click="changePlaySpeed(1.25)" class="btn speed-btn" :class="{ active: playbackRate === 1.25 }">1.25x</button>
              </div>
            </div>
            <div v-if="audioBuffering && !audioLoading" class="audio-buffering">Buffering...</div>
            <div v-if="audioLoading && !showSkipOption" class="audio-loading">Loading audio...</div>
            <div v-if="audioLoading && showSkipOption" class="audio-timeout">
              <p>Audio is taking too long to load. This could be due to a slow connection.</p>
              <button class="btn skip-btn" @click="skipQuestion">Skip This Question</button>
              <p class="skip-note">Skipping won't count against you</p>
            </div>
            <div v-if="audioError" class="audio-error">
              <p>Error loading audio.</p>
              <button class="btn skip-btn" @click="skipQuestion">Skip This Question</button>
              <p class="skip-note">Skipping won't count against you</p>
            </div>
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

        <!-- Validation Scenarios MCQ -->
        <div v-else-if="current.type === 'validation-mcq'">
          <div class="segments-display" v-if="current.segments">
            <div v-for="(seg, i) in current.segments" :key="i" class="segment-item">
              <span class="segment-time">{{ seg.start }}s - {{ seg.end }}s</span>
              <span class="segment-lyrics">{{ seg.lyrics }}</span>
            </div>
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

        <!-- Fill-in-the-Blank -->
        <div v-else-if="current.type === 'cloze'">
          <div class="audio-player" v-if="current.audioUrl">
            <audio
              ref="audioPlayer"
              :src="current.audioUrl"
              preload="auto"
              @loadedmetadata="onAudioLoaded"
              @timeupdate="onTimeUpdate"
              @error="onAudioError"
              @waiting="onAudioWaiting"
              @playing="onAudioPlaying"
            ></audio>
            <div class="audio-controls">
              <button class="btn" @click="replayAudio" :disabled="audioLoading || audioBuffering">
                {{ audioBuffering ? '⏳ Buffering...' : '🔄 Replay' }}
              </button>
              <div class="speed-controls">
                <button @click="changePlaySpeed(0.75)" class="btn speed-btn" :class="{ active: playbackRate === 0.75 }">0.75x</button>
                <button @click="changePlaySpeed(1)" class="btn speed-btn" :class="{ active: playbackRate === 1 }">1x</button>
                <button @click="changePlaySpeed(1.25)" class="btn speed-btn" :class="{ active: playbackRate === 1.25 }">1.25x</button>
              </div>
            </div>
            <div v-if="audioBuffering && !audioLoading" class="audio-buffering">Buffering...</div>
            <div v-if="audioLoading && !showSkipOption" class="audio-loading">Loading audio...</div>
            <div v-if="audioLoading && showSkipOption" class="audio-timeout">
              <p>Audio is taking too long to load. This could be due to a slow connection.</p>
              <button class="btn skip-btn" @click="skipQuestion">Skip This Question</button>
              <p class="skip-note">Skipping won't count against you</p>
            </div>
            <div v-if="audioError" class="audio-error">
              <p>Error loading audio.</p>
              <button class="btn skip-btn" @click="skipQuestion">Skip This Question</button>
              <p class="skip-note">Skipping won't count against you</p>
            </div>
          </div>

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
        Proficiency level: <span class="badge">{{ level.name }}</span>
      </p>
      <p class="desc">{{ level.description }}</p>

      <div class="nav center-align">
        <button v-if="!passed" class="btn" @click="reset">Restart</button>
        <button v-if="passed" class="btn primary next-btn" @click="showAwards">Next</button>
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

// Audio playback state
const audioPlayer = ref(null);
const audioPlaying = ref(false);
const audioLoading = ref(false);
const audioError = ref(false);
const audioBuffering = ref(false);
const playbackRate = ref(1);

// Audio loading timeout state
const waitingForAudio = ref(false);
const showSkipOption = ref(false);
const AUDIO_LOAD_TIMEOUT = 15000; // 15 seconds
let audioLoadTimeoutId = null;

// Double-click protection
const transitioning = ref(false);

// QUESTION BANK - Based on provided songs with IPFS URLs
const masterBank = [
  // Lyric Accuracy MCQ - Alone With You
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYszenbZHnfBR75PW5U6FZxxb6hZ2zMgu3pyjtGqU8DEB",
    timeRange: { start: 15, end: 22 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Something about the look on your face as you're fading away, baby, I feel it too",
      "Something about the look on your face as your fading away, baby, I feel it to",
      "Something about the look on you're face as you're fading away, baby, I feel it too",
      "Something about the look on your face as you're fading away, baby, I feeling too"
    ],
    answer: "Something about the look on your face as you're fading away, baby, I feel it too"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYszenbZHnfBR75PW5U6FZxxb6hZ2zMgu3pyjtGqU8DEB",
    timeRange: { start: 27, end: 33 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "We could rendezvous. Maybe it's the whether",
      "We could rendezvous. Maybe it's the weather",
      "We could rendezvous. Maybe its the weather",
      "We can rendezvous. Maybe it's the weather"
    ],
    answer: "We could rendezvous. Maybe it's the weather"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYszenbZHnfBR75PW5U6FZxxb6hZ2zMgu3pyjtGqU8DEB",
    timeRange: { start: 122, end: 129 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Alone with you. That all that it takes.",
      "Alone with you, thats all that it takes.",
      "Alone with you, that's all that it take.",
      "Alone with you, thats all that it take.",
    ],
    answer: "Alone with you, that's all that it take."
  },
  // Lyric Accuracy MCQ - Jude's Song
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYNwJNJobawWUKruiow4uJPEVXKvgy7ekiHBjjzDnbSaW",
    timeRange: { start: 6, end: 15 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Yeah, call my name, I'll be there any night and any day",
      "Yeah, call my name, I'll be their any night and any day",
      "Yeah, call my name, I'll be there any knight and any day",
      "Yeah, call my name, I'll be there every night and every day"
    ],
    answer: "Yeah, call my name, I'll be there any night and any day"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYNwJNJobawWUKruiow4uJPEVXKvgy7ekiHBjjzDnbSaW",
    timeRange: { start: 16, end: 24 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Take my hand, I got you, that'll always stay the same",
      "Take my hand, I got you, that will always stay the same",
      "Take my hand, I got you, that'll always stay the saim",
      "Take my hand, I've got you, that'll always stay the same"
    ],
    answer: "Take my hand, I got you, that'll always stay the same"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYNwJNJobawWUKruiow4uJPEVXKvgy7ekiHBjjzDnbSaW",
    timeRange: { start: 48, end: 53 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "I know this world can get kinda cold, summer comes and it goes.",
      "I know this world can get kind of cold, summer comes and it go.",
      "I know this world can get kinda called, summa comes and it goes.",
      "I know this world can get kinda cold, some comes and it goes."
    ],
    answer: "I know this world can get kinda cold, summer comes and it goes."
  },
  // Lyric Accuracy MCQ - On My Own
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/Qmc7wjaXUyDLc5Tx65AW66cQrhjSVdYszAcpZEm8k4DMMu",
    timeRange: { start: 39, end: 44 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Haven't been back home in a minute, give me two bottles, Grey Goose, I'ma gonna kill it",
      "Haven't been back home in a minute, give me two bottles, Grey Goose, I'ma kill it",
      "Haven't been back home in a minute, give me too bottles, Gray Goose, I'm kill it",
      "Haven't been back home in a minute, give me too bottles, Grey Goose, I'ma kill it"

    ],
    answer: "Haven't been back home in a minute, give me two bottles, Grey Goose, I'ma kill it"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/Qmc7wjaXUyDLc5Tx65AW66cQrhjSVdYszAcpZEm8k4DMMu",
    timeRange: { start: 122, end: 126 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Don't worry bout me, I'm doing just fine",
      "Don't worry bout me, I'm doing just fine",
      "Don't worry about me, I'm doing just fine",
      "Dont worry about me, I'm doing just fine"
    ],
    answer: "Don't worry about me, I'm doing just fine"
  },
  // Lyric Accuracy MCQ - Fire (Never Dies)
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmRqaFS9erQVM4H4S4rSHZ9kB3cazogwp8tDWnGs1nBrMg",
    timeRange: { start: 0, end: 8 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Do you remember dancing in the snow in December?",
      "Do you remember dancing in the snow in November?",
      "Do you remember dancing in the snow and December?",
      "Did you remember dancing in the snow in December?"
    ],
    answer: "Do you remember dancing in the snow in December?"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmRqaFS9erQVM4H4S4rSHZ9kB3cazogwp8tDWnGs1nBrMg",
    timeRange: { start: 48, end: 51 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "For you it never died",
      "For you I never die",
      "For you it never dries",
      "For you it never dies",
    ],
    answer: "For you it never dies"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmRqaFS9erQVM4H4S4rSHZ9kB3cazogwp8tDWnGs1nBrMg",
    timeRange: { start: 65, end: 74 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "And I know I'm only here for tonight, so I'm using what I got to give you all my time",
      "And I know I'm only here for the night, so I'm using what I got to give you all my time",
      "And I know Im only here for the night, so Im using what Ive got to give you all my time",
      "And I know I'm only here for the night, so I'm using what I got to give you on my time"
    ],
    answer: "And I know I'm only here for the night, so I'm using what I got to give you all my time"
  },
  // Lyric Accuracy MCQ - More Than Enough
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 13, end: 19 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "You got away with words. You take away the hurt",
      "You got a way with words. You take away the hurt",
      "You've got away with words. You take away the hurt",
      "You got away with words. You took away the hurt"
    ],
    answer: "You got a way with words. You take away the hurt"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 32, end: 39 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "Give me what I want when I'm ready. Always hold it down",
      "Give me what I want when I'm ready. Always holding down",
      "Give me what I want when I'm ready. Always hold me down",
      "Give me what I want when I am ready. Always hold it down"
    ],
    answer: "Give me what I want when I'm ready. Always hold it down"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 67, end: 73 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "I get lost inside all the stars in your eyes is a galaxy",
      "I get lost inside all the stars in your eyes it's a galaxy",
      "I get lost inside of the stars in your eyes it's a galaxy",
      "I get lost inside all the stars in you're eyes it's a galaxy"
    ],
    answer: "I get lost inside all the stars in your eyes it's a galaxy"
  },
  {
    type: "lyric-mcq",
    duration: 100,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 73, end: 79 },
    prompt: "Listen to the audio and select the correct lyrics:",
    options: [
      "You control the tide like the moon in the sky with the gravity",
      "You control the tide like the moon in the sky with gravity",
      "You control the time like the moon in the sky with the gravity",
      "You control the tide like the moon in the skies with the gravity"
    ],
    answer: "You control the tide like the moon in the sky with the gravity"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 1.50, end: 3.20, lyrics: "Hello darkness my old friend" },
      { start: 3.00, end: 5.10, lyrics: "I've come to talk with you again" }
    ],
    prompt: "What is wrong with these segments?",
    options: [
      "The lyrics are incorrect",
      "The segments overlap",
      "The timing is too short",
      "Nothing is wrong"
    ],
    answer: "The segments overlap"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 5.50, end: 3.20, lyrics: "This line is backwards" }
    ],
    prompt: "What is wrong with this segment?",
    options: [
      "The lyrics are missing",
      "The lyrics are too short",
      "The timing is incorrect",
      "The lyrics are too long"
    ],
    answer: "The timing is incorrect"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 10.00, end: 12.50, lyrics: "Walking down the street" },
      { start: 12.50, end: 15.00, lyrics: "Feeling so complete" }
    ],
    prompt: "What is the status of these segments?",
    options: [
      "They overlap",
      "They are correctly formatted",
      "They are missing lyrics",
      "The timing is backwards"
    ],
    answer: "They are correctly formatted"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 20.00, end: 22.00, lyrics: "I cant hear you" },
      { start: 22.00, end: 24.50, lyrics: "Now I can hear clearly" }
    ],
    prompt: "Are these segments properly formatted?",
    options: [
      "The lyrics are incorrect",
      "Everything is correct",
      "The segments overlap",
      "The timing is incorrect"
    ],
    answer: "The lyrics are incorrect"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 15.00, end: 18.50, lyrics: "First verse of the song" },
      { start: 18.50, end: 17.00, lyrics: "Second verse immediately after" }
    ],
    prompt: "Identify the issue with these segments:",
    options: [
      "They are correctly timed",
      "The timing is incorrect",
      "The segments overlap slightly",
      "Something is off with the lyrics"
    ],
    answer: "The timing is incorrect"
  },
  {
    type: "validation-mcq",
    duration: 45,
    segments: [
      { start: 45.00, end: 48.23, lyrics: "She was my heart I dont know the tribe" },
      { start: 48.27, end: 52.50, lyrics: "But by default she don't think of me" }
    ],
    prompt: "What should be corrected in the first segment?",
    options: [
      "The timing is incorrect",
      "Nothing needs correction",
      "The lyrics are wrong",
      "The segments overlap"
    ],
    answer: "The lyrics are wrong"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "A singer slurs two words together so they sound like one, but careful listening reveals both words are present. What should you submit?",
    options: [
      "The combined word as it sounds",
      "The two distinct words as sung",
      "The grammatically correct version",
      "The version listed in unofficial lyrics sites"
    ],
    answer: "The two distinct words as sung"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "The artist clearly mispronounces a word ('pacifically' instead of 'specifically'). How should it be transcribed?",
    options: [
      "Corrected to the intended word",
      "Phonetically rewritten",
      "Transcribed exactly as sung",
      "Omitted entirely"
    ],
    answer: "Transcribed exactly as sung"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "A lyric is grammatically incorrect but repeated consistently throughout the song. What is the correct approach?",
    options: [
      "Fix it for clarity",
      "Fix it only in the chorus",
      "Transcribe it exactly as sung",
      "Replace it with a similar correct phrase"
    ],
    answer: "Transcribe it exactly as sung"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "Background vocals contain different words than the lead vocal during the chorus. When should they be included?",
    options: [
      "Always",
      "Only if louder than the lead",
      "Only if they are integral and clearly audible",
      "Never"
    ],
    answer: "Only if they are integral and clearly audible"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "A singer clearly sings 'I waited 24 hours for you'. How should the number be transcribed?",
    options: [
      "Write it as '24'",
      "Write it as 'twenty-four'",
      "Write it as 'twentyfour'",
      "Write it as '24 (twenty-four)'"
    ],
    answer: "Write it as 'twenty-four'"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "A song title is stylized in ALL CAPS. How should the lyrics be capitalized?",
    options: [
      "Match the title",
      "Use standard capitalization rules",
      "Capitalize every line",
      "Use all lowercase"
    ],
    answer: "Use standard capitalization rules"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "The singer shouts a word for emphasis. How should capitalization be handled?",
    options: [
      "ALL CAPS",
      "Capitalize only the first letter",
      "Standard capitalization",
      "Add exclamation points"
    ],
    answer: "Standard capitalization"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "An acronym is sung letter by letter (e.g., 'N-A-S-A'). How should it appear?",
    options: [
      "nasa",
      "Nasa",
      "NASA",
      "N.a.s.a"
    ],
    answer: "NASA"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "A lyric trails off without completion. How should punctuation be handled?",
    options: [
      "Add ellipses",
      "Add a period",
      "Leave it unpunctuated",
      "Add a dash"
    ],
    answer: "Leave it unpunctuated"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "Why is excessive punctuation like '!!!' incorrect?",
    options: [
      "It looks unprofessional",
      "It is never audible",
      "Standard lyric guidelines prohibit it",
      "It changes the meaning of lyrics"
    ],
    answer: "Standard lyric guidelines prohibit it"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "A spoken phrase repeats rhythmically throughout the chorus. How should it be treated?",
    options: [
      "Omitted",
      "Transcribed as background vocals",
      "Transcribed as lyrics",
      "Placed in brackets"
    ],
    answer: "Transcribed as lyrics"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "Background vocals echo the last word of each line. What is the best approach?",
    options: [
      "Transcribe every echo",
      "Omit all echoes",
      "Transcribe if they add meaning or emphasis",
      "Transcribe only the first echo"
    ],
    answer: "Transcribe if they add meaning or emphasis"
  },
  {
    type: "validation-mcq",
    duration: 45,
    prompt: "A clean version removes part of a swear word audibly. How should it be transcribed?",
    options: [
      "Use the full uncensored word",
      "Use asterisks (*) for missing letters",
      "Guess the intended word",
      "Omit the word"
    ],
    answer: "Use asterisks (*) for missing letters"
  },
  {
    type: "validation-mcq",
    duration: 50,
    prompt: "Why must lyrics match the specific audio version submitted?",
    options: [
      "For artistic consistency",
      "For legal and distribution accuracy",
      "For stylistic preference",
      "For faster approval"
    ],
    answer: "For legal and distribution accuracy"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmXBpVzAHzdR7FS5ZT295kbt2PQT9A8DDLSug7VwDkw7Fr",
    timeRange: { start: 0, end: 10 },
    prompt: "What is the missing word: 'I _____ you, I _____ you, I _____ you'",
    accepted_answers: ["love"],
    hint: "Listen to the repeated word"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmXBpVzAHzdR7FS5ZT295kbt2PQT9A8DDLSug7VwDkw7Fr",
    timeRange: { start: 22, end: 28 },
    prompt: "Fill in the missing word: 'I know you see it girl, this ain't sitting real good in my _____.'",
    accepted_answers: ["soul"],
    hint: "Your innermost being"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYNwJNJobawWUKruiow4uJPEVXKvgy7ekiHBjjzDnbSaW",
    timeRange: { start: 70, end: 76 },
    prompt: "Fill in the missing word: 'I can't wait till you're old _____.'",
    accepted_answers: ["enough"],
    hint: "What stage of life?"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmYszenbZHnfBR75PW5U6FZxxb6hZ2zMgu3pyjtGqU8DEB",
    timeRange: { start: 48, end: 58 },
    prompt: "Fill in the missing word: 'Why don't we drive a little, ride a little, find a place with a _____.'",
    accepted_answers: ["view"],
    hint: "What do you find at a scenic location?"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/Qmc7wjaXUyDLc5Tx65AW66cQrhjSVdYszAcpZEm8k4DMMu",
    timeRange: { start: 118, end: 125 },
    prompt: "Fill in the missing word: 'Living my youth one day at a _____.'",
    accepted_answers: ["time"],
    hint: "One day at a ___"
  },
  // Cloze - More Than Enough
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 13, end: 19 },
    prompt: "Fill in the missing word: 'You got away with _____, you take away the hurt'",
    accepted_answers: ["words"],
    hint: "What do you speak with?"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 48, end: 52 },
    prompt: "Fill in the missing word: 'Serve it on a _____, all that really matters'",
    accepted_answers: ["platter"],
    hint: "What do you serve food on?"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 67, end: 70 },
    prompt: "Fill in the missing word: 'I get lost inside all the _____ in your eyes'",
    accepted_answers: ["stars"],
    hint: "You see them at night"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 70, end: 74 },
    prompt: "What is the missing word: 'It's a _____, _____.'",
    accepted_answers: ["galaxy"],
    hint: "A large system of stars"
  },
  {
    type: "cloze",
    duration: 55,
    audioUrl: "https://ipfs.effect.ai/ipfs/QmP83bSifLZ1qd2GZRLYVDsVQm3K42mcKM1er2gJoZubNm",
    timeRange: { start: 73, end: 79 },
    prompt: "Fill in the missing word: 'You control the _____ like the moon in the sky'",
    accepted_answers: ["tide"],
    hint: "What does the moon affect in the ocean?"
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
  clearTimeout(audioLoadTimeoutId);
  if (!current.value) return;

  // Check if current question has audio
  const hasAudio = !!current.value.audioUrl;

  if (hasAudio && audioLoading.value) {
    // Wait for audio to load before starting timer
    waitingForAudio.value = true;
    showSkipOption.value = false;

    // Check if audio is already loaded (cached) after Vue renders
    // This handles the race condition where loadedmetadata fires before Vue attaches the listener
    setTimeout(() => {
      if (audioPlayer.value && audioPlayer.value.readyState >= 1 && audioLoading.value) {
        onAudioLoaded();
      }
    }, 100);

    // Set timeout for audio loading - show skip option after timeout
    audioLoadTimeoutId = setTimeout(() => {
      if (waitingForAudio.value && audioLoading.value) {
        // Double-check if audio actually loaded but event was missed
        if (audioPlayer.value && audioPlayer.value.readyState >= 1) {
          onAudioLoaded();
          return;
        }
        showSkipOption.value = true;
      }
    }, AUDIO_LOAD_TIMEOUT);

    return; // Don't start timer yet
  }

  // Start the timer immediately for non-audio questions or when audio is ready
  waitingForAudio.value = false;
  showSkipOption.value = false;
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
  if (!hasAttemptsRemaining(transcriptionCapability?.id)) {
    alert("You have no attempts remaining for this test.");
    return;
  }

  // Select questions from bank
  const lyricMCQ = masterBank.filter(q => q.type === "lyric-mcq");
  const validationMCQ = masterBank.filter(q => q.type === "validation-mcq");
  const cloze = masterBank.filter(q => q.type === "cloze");

  // Take required number of each type
  const selectedLyric = shuffleArray(lyricMCQ).slice(0, Math.min(10, lyricMCQ.length));
  const selectedValidation = shuffleArray(validationMCQ).slice(0, Math.min(10, validationMCQ.length));
  const selectedCloze = shuffleArray(cloze).slice(0, Math.min(5, cloze.length));

  questions.value = shuffleArray([...selectedLyric, ...selectedValidation, ...selectedCloze]);

  answers.value = Array(questions.value.length).fill(null);
  phase.value = "quiz";
  index.value = 0;

  // Increment attempt counter when test starts
  incrementTestAttempt(transcriptionCapability?.id, false);

  // Initialize audio loading state for first question
  const firstQuestion = questions.value[0];
  audioLoading.value = !!firstQuestion?.audioUrl;
  audioError.value = false;
  waitingForAudio.value = false;
  showSkipOption.value = false;

  startTimer();
}

// Audio player functions
function onAudioLoaded() {
  audioLoading.value = false;
  audioError.value = false;
  clearTimeout(audioLoadTimeoutId);
  showSkipOption.value = false;

  // If there's a time range, seek to the start
  if (current.value.timeRange && audioPlayer.value) {
    audioPlayer.value.currentTime = current.value.timeRange.start;
  }

  // If we were waiting for audio to load, start the timer now
  if (waitingForAudio.value) {
    waitingForAudio.value = false;
    startTimer();
  }
}

function onTimeUpdate() {
  if (!current.value.timeRange || !audioPlayer.value) return;

  // Pause when reaching end time
  if (audioPlayer.value.currentTime >= current.value.timeRange.end) {
    audioPlayer.value.pause();
    audioPlaying.value = false;
  }
}

function onAudioError() {
  audioLoading.value = false;
  audioError.value = true;
  audioBuffering.value = false;
  clearTimeout(audioLoadTimeoutId);
  // Clear waiting state so timer shows proper state
  waitingForAudio.value = false;
  showSkipOption.value = false;
}

function onAudioWaiting() {
  // Audio is buffering mid-playback
  audioBuffering.value = true;
}

function onAudioPlaying() {
  // Audio resumed playing after buffering
  audioBuffering.value = false;
}

function replayAudio() {
  if (!audioPlayer.value) return;

  // Reset to start time if time range is specified
  if (current.value.timeRange) {
    audioPlayer.value.currentTime = current.value.timeRange.start;
  } else {
    audioPlayer.value.currentTime = 0;
  }

  // Handle mobile autoplay restrictions - play() returns a promise
  const playPromise = audioPlayer.value.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        audioPlaying.value = true;
      })
      .catch(() => {
        // Autoplay was prevented or other error
        audioPlaying.value = false;
      });
  } else {
    audioPlaying.value = true;
  }
}

function changePlaySpeed(rate) {
  playbackRate.value = rate;
  if (audioPlayer.value) {
    audioPlayer.value.playbackRate = rate;
  }
}

function next() {
  // Prevent double-clicks
  if (transitioning.value) return;
  transitioning.value = true;

  clearInterval(timerInterval);
  clearTimeout(audioLoadTimeoutId);

  // Stop audio if playing
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlaying.value = false;
  }

  // Reset audio loading states
  waitingForAudio.value = false;
  showSkipOption.value = false;
  audioBuffering.value = false;

  if (index.value < questions.value.length - 1) {
    index.value++;
    // Set audioLoading based on whether next question has audio
    const nextQuestion = questions.value[index.value];
    audioLoading.value = !!nextQuestion?.audioUrl;
    audioError.value = false;
    startTimer();
    // Re-enable button after short delay
    setTimeout(() => { transitioning.value = false; }, 100);
  } else {
    phase.value = "result";

    // Award capabilities immediately when reaching result (don't wait for modal claim)
    // This prevents losing capability if user refreshes before claiming
    if (passed.value) {
      awardCapability(transcriptionCapability?.id);
    }
    if (earnedValidation.value) {
      awardCapability(validationCapability?.id);
      // Only mark as "fully passed" if they earned validation capability (80%+)
      // This allows users who only got transcription (72-79%) to retry for validation
      incrementTestAttempt(transcriptionCapability?.id, true);
    }
  }
}

function skipQuestion() {
  // Skip the current question without counting it
  clearInterval(timerInterval);
  clearTimeout(audioLoadTimeoutId);
  waitingForAudio.value = false;
  showSkipOption.value = false;
  audioBuffering.value = false;

  // Stop audio if playing
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlaying.value = false;
  }

  // Remove the current question from the test
  questions.value.splice(index.value, 1);
  answers.value.splice(index.value, 1);

  // Check if there are more questions
  if (questions.value.length === 0) {
    // No more questions - go to result
    phase.value = "result";
    // Note: With 0 questions, passed will be false due to MIN_QUESTIONS_TO_PASS check
  } else if (index.value >= questions.value.length) {
    // We were on the last question, go to result
    phase.value = "result";

    // Award capabilities immediately when reaching result
    if (passed.value) {
      awardCapability(transcriptionCapability?.id);
    }
    if (earnedValidation.value) {
      awardCapability(validationCapability?.id);
      // Only mark as "fully passed" if they earned validation capability (80%+)
      incrementTestAttempt(transcriptionCapability?.id, true);
    }
  } else {
    // Move to next question (index stays the same since we removed current)
    audioLoading.value = !!questions.value[index.value]?.audioUrl;
    audioError.value = false;
    startTimer();
  }
}

function reset() {
  // Check if user has attempts remaining before allowing restart
  if (!hasAttemptsRemaining(transcriptionCapability?.id)) {
    alert("You have no attempts remaining for this test.");
    return;
  }

  clearInterval(timerInterval);
  clearTimeout(audioLoadTimeoutId);
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlaying.value = false;
  }

  phase.value = "intro";
  index.value = 0;
  answers.value = [];
  questions.value = [];
  waitingForAudio.value = false;
  showSkipOption.value = false;
  audioLoading.value = false;
  audioError.value = false;
  audioBuffering.value = false;
  transitioning.value = false;
}

function normalize(a) {
  if (a == null) return "";
  return String(a).trim().toLowerCase();
}

const score = computed(() =>
  questions.value.reduce((sum, q, i) => {
    const user = answers.value[i];
    if (q.type === "cloze") {
      // Handle multiple acceptable answers
      const acceptedAnswers = Array.isArray(q.accepted_answers) ? q.accepted_answers : [q.answer];
      const normalizedAnswers = acceptedAnswers.map(a => normalize(a));
      return sum + (normalizedAnswers.includes(normalize(user)) ? 1 : 0);
    } else {
      return sum + (user === q.answer ? 1 : 0);
    }
  }, 0),
);

const level = computed(() => {
  const s = score.value;
  const total = questions.value.length;
  if (total === 0) return { name: "—", description: "" };

  const pct = (s / total) * 100;
  if (pct < 52) // 13 out of 25
    return {
      name: "Beginner",
      description: "Not yet ready for music transcription tasks. Consider reviewing the guidelines and trying again.",
    };
  if (pct < 72) // 18 out of 25
    return {
      name: "Developing",
      description: "Some understanding of transcription principles, but needs improvement before handling real tasks.",
    };
  if (pct < 80) //20 out of 25
    return {
      name: "Proficient",
      description: "Good grasp of music transcription verification. Ready to handle standard transcription tasks.",
    };
  return {
    name: "Expert",
    description: "Excellent transcription skills. Ready for complex music transcription verification tasks.",
  };
});

// Passing thresholds
// Minimum 15 questions required to pass (prevents skipping all questions exploit)
const MIN_QUESTIONS_TO_PASS = 15;
// Pass at "Proficient" level (72% = 18/25)
const passed = computed(() =>
  phase.value === "result" &&
  questions.value.length >= MIN_QUESTIONS_TO_PASS &&
  score.value >= Math.ceil(questions.value.length * 0.72)
);
// Get validator at "Expert" level (80% = 20/25)
const earnedValidation = computed(() =>
  phase.value === "result" &&
  questions.value.length >= MIN_QUESTIONS_TO_PASS &&
  score.value >= Math.ceil(questions.value.length * 0.8)
);

// Award modal states
const showTranscriptionAward = ref(false);
const showValidationAward = ref(false);

// Handler for when user continues from transcription award
function onTranscriptionAwardContinue() {
  showTranscriptionAward.value = false;
  // If they also earned validation, show that modal next
  if (earnedValidation.value) {
    showValidationAward.value = true;
  }
}

// Show the first award when user clicks Next on result screen
function showAwards() {
  showTranscriptionAward.value = true;
}

onUnmounted(() => {
  clearInterval(timerInterval);
  clearTimeout(audioLoadTimeoutId);
  if (audioPlayer.value) {
    audioPlayer.value.pause();
  }
});

const {
  availableCapabilities,
  incrementTestAttempt,
  hasAttemptsRemaining,
  awardCapability,
} = useCapabilities();

// Get both capability references
const transcriptionCapability = availableCapabilities.find((c) =>
  c.id === "effectai/music-transcription:0.0.1"
);
const validationCapability = availableCapabilities.find((c) =>
  c.id === "effectai/music-transcription-validation:0.0.1"
);
</script>

<style scoped>
  .music-test {
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
    min-height: 200px;
  }
  .qtext {
    font-size: 1.05rem;
    margin-bottom: 0.75rem;
  }

  /* Audio Player Styles */
  .audio-player {
    margin: 1rem 0;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
  .audio-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .speed-controls {
    display: flex;
    gap: 5px;
    margin-left: auto;
  }
  .audio-loading {
    margin-top: 0.5rem;
    color: #6366f1;
    font-size: 0.9rem;
  }
  .audio-buffering {
    margin-top: 0.5rem;
    color: #d97706;
    font-size: 0.9rem;
    animation: pulse 1s infinite;
  }
  .audio-error {
    margin-top: 0.5rem;
    color: #dc2626;
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem;
  }
  .audio-error p {
    margin-bottom: 0.75rem;
  }
  .audio-timeout {
    margin-top: 0.5rem;
    color: #d97706;
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
  }
  .audio-timeout p {
    margin-bottom: 0.75rem;
  }
  .skip-btn {
    background: #f97316!important;
    color: white;
    border-color: #ea580c!important;
    margin: 0.5rem auto;
    display: block;
  }
  .skip-btn:hover {
    background: #ea580c!important;
  }
  .skip-note {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.5rem;
  }
  .timer.loading {
    color: #6366f1;
  }

  /* Segments Display */
  .segments-display {
    margin: 1rem 0;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
  .segment-item {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    margin: 0.25rem 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .segment-item:last-child {
    border-bottom: none;
  }
  .segment-time {
    font-weight: 600;
    color: #6366f1;
    min-width: 100px;
  }
  .segment-lyrics {
    color: #475569;
  }

  .options {
    display: grid;
    gap: 8px;
  }
  .opt {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    min-height: 44px;
  }
  .opt input[type="radio"] {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .opt span {
    word-break: break-word;
    line-height: 1.4;
  }
  .opt:hover {
    background: #f8fafc;
  }
  .opt:active {
    background: #f1f5f9;
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
  .btn.small {
    padding: 6px 10px;
    font-size: 0.85rem;
  }
  .btn.speed-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn.active {
    background: #6366f1;
    color: #fff;
    border-color: #6366f1;
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

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .music-test {
      padding: 8px;
    }
    .card {
      padding: 12px;
    }
    .topbar {
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta {
      width: 100%;
      justify-content: space-between;
    }
    .audio-controls {
      flex-direction: column;
      align-items: stretch;
    }
    .speed-controls {
      margin-left: 0;
      justify-content: center;
      margin-top: 8px;
    }
    .btn.speed-btn {
      flex: 1;
    }
    .qtext {
      font-size: 1rem;
    }
    .opt {
      padding: 14px 12px;
    }
    .opt span {
      font-size: 0.95rem;
    }
    .segment-item {
      flex-direction: column;
      gap: 0.25rem;
    }
    .segment-time {
      min-width: auto;
    }
  }
</style>
