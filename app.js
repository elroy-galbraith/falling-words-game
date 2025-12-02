// HTTP GET LEVEL FROM index.html
const params = new URLSearchParams(window.location.search);
const LEVEL = params.get('lvl');

// DOM ELEMENTS
const buttonElementID = document.getElementById('StartButton');
const gameContentID = document.getElementById('GameContent');
const gameContentClass = document.getElementsByClassName('game-content');
const inputElementID = document.getElementById('InputWord');
const scoreElementID = document.getElementById('Score');
const scoreElementClass = document.getElementsByClassName('score');
const levelElementID = document.getElementById('Level');
const micStatusID = document.getElementById('MicStatus');

// VARIABLES
const currentLevel = LEVEL;
const gameWidth = gameContentID.clientWidth;
const gameHeight = gameContentID.clientHeight;
let score = 0;
let gameOver = false;
let arrWords = [];
let arrWordsDiv = [];
let topVal = 0;

// DATA COLLECTION VARIABLES
let mediaRecorder;
let audioChunks = [];
let sessionMetadata = [];
let recognition;
let startTime;

// SOUNDS
const startGameSound = document.getElementById('StartGameSound');
const gameoverSound = document.getElementById('GameoverSound');
const pointSound = document.getElementById('PointSound');
const notPointSound = document.getElementById('NotPointSound');

// DEFAULT VOLUME
startGameSound.style.zIndex = 1;
startGameSound.volume = 0.5;
gameoverSound.volume = 0.5;
pointSound.volume = 0.2;

// DICTIONARY PHRASES
const DICTIONARY = [
  'hello world',
  'good morning',
  'thank you very much',
  'how are you doing',
  'see you later',
  'have a nice day',
  'what time is it',
  'please help me',
  'I appreciate it',
  'nice to meet you',
  'take care of yourself',
  'let me know',
  'sounds good to me',
  'I will be right back',
  'it was a pleasure',
  'hope you feel better',
  'make yourself at home',
  'long time no see',
  'what do you think',
  'I am not sure',
  'could you please',
  'excuse me sir',
  'that makes sense',
  'I understand now',
  'have a great day',
  'you are welcome',
  'no problem at all',
  'I will do my best',
  'looking forward to it',
  'let us get started',
  'thanks for your time',
  'see you tomorrow',
  'talk to you later',
  'I really appreciate that',
  'that is very kind',
  'what brings you here',
  'how can I help',
  'just a moment please',
  'I will check that',
  'sounds like a plan',
  'I agree with you',
  'that is a good point',
  'I had a great time',
  'catch you later',
  'take it easy',
  'no worries at all',
  'I will keep that in mind',
  'good to see you',
  'how have you been',
  'thanks for letting me know',
];

// GAME START
async function init() {
  showLevel();

  // Show consent modal first
  console.log("Calling showConsentModal...");

  // Wait indefinitely for user to consent or decline
  const consent = await showConsentModal();
  console.log("Consent result:", consent);

  if (consent.hasConsented) {
    console.log('User consented. Starting with data collection.');
    console.log('User ID:', consent.userId);

    try {
      await setupAudioRecording();
      setupSpeechRecognition();

      startTime = Date.now();
      mediaRecorder.start(1000); // Request data every 1 second
      recognition.start();
      micStatusID.innerText = "Microphone: Listening (REC)";
      micStatusID.style.color = "#00ff00"; // Green

      // Start Game Loop
      setInterval(() => {
        if (!gameOver) {
          drawWord();
        }
      }, currentLevel);
      updateWordPosition();

    } catch (err) {
      console.error("Error initializing game:", err);
      micStatusID.innerText = "Error: " + err.message;
      micStatusID.style.color = "red";
      alert("Microphone access is required to play this version of the game.");
    }
  } else {
    console.log('User declined consent. Starting without data collection.');

    try {
      // Still need speech recognition to play, but no recording
      setupSpeechRecognition();

      recognition.start();
      micStatusID.innerText = "Microphone: Listening (No Recording)";
      micStatusID.style.color = "#ffaa00"; // Orange

      // Start Game Loop
      setInterval(() => {
        if (!gameOver) {
          drawWord();
        }
      }, currentLevel);
      updateWordPosition();

    } catch (err) {
      console.error("Error initializing game:", err);
      micStatusID.innerText = "Error: " + err.message;
      micStatusID.style.color = "red";
      alert("Microphone access is required to play this game.");
    }
  }
}

// SETUP AUDIO RECORDING
async function setupAudioRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Try to use the best available audio format
  let options = { mimeType: 'audio/webm;codecs=opus' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'audio/webm' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: '' }; // Use default
    }
  }

  mediaRecorder = new MediaRecorder(stream, options);
  console.log("MediaRecorder created with mimeType:", mediaRecorder.mimeType);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
      console.log("Audio chunk received, size:", event.data.size, "Total chunks:", audioChunks.length);
    }
  };

  mediaRecorder.onstop = () => {
    console.log("Recording stopped. Total chunks:", audioChunks.length);
    console.log("Total audio size:", audioChunks.reduce((sum, chunk) => sum + chunk.size, 0), "bytes");
  };

  mediaRecorder.onerror = (event) => {
    console.error("MediaRecorder error:", event.error);
  };
}

// SETUP SPEECH RECOGNITION
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Your browser does not support Speech Recognition. Please use Chrome.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const lastResultIndex = event.results.length - 1;
    const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);

    // Check if the full transcript matches any phrase
    checkPhraseMatch(transcript);
  };

  recognition.onend = () => {
    if (!gameOver) {
      recognition.start(); // Restart if game is still going
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    micStatusID.innerText = "Mic Error: " + event.error;
  };
}

// CHECK PHRASE MATCH
function checkPhraseMatch(spokenTranscript) {
  // Normalize the transcript
  spokenTranscript = spokenTranscript.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  // Check if any active phrase matches
  for (let i = 0; i < arrWords.length; i++) {
    const phrase = arrWords[i];

    // Check if the spoken transcript contains or exactly matches the phrase
    if (spokenTranscript === phrase || spokenTranscript.includes(phrase)) {
      let wordDiv = arrWordsDiv[i];

      // Calculate Pressure Metric (0.0 = top, 1.0 = bottom/gameover)
      let currentTop = parseInt(wordDiv.style.top.replace('px', ''));
      let pressure = currentTop / gameHeight;

      // Log Data
      sessionMetadata.push({
        phrase: phrase,
        timestamp: Date.now() - startTime,
        pressure_metric: parseFloat(pressure.toFixed(4)),
        level: LEVEL
      });

      // Game Logic
      updateScore();
      arrWords.splice(i, 1);
      arrWordsDiv.splice(i, 1);
      wordDiv.parentNode.removeChild(wordDiv);
      playSound(pointSound, 0, notPointSound);

      // Visual Feedback
      inputElementID.value = `MATCH: ${phrase.toUpperCase()}!`;
      setTimeout(() => { if (!gameOver) inputElementID.value = "Speak the phrases!"; }, 1500);

      break; // Only match one phrase per utterance
    }
  }
}

// CREATE WORD
function drawWord() {
  const word = generateRandomWord(DICTIONARY);
  arrWords.push(word);
  let wordDiv = document.createElement('div');
  wordDiv.innerHTML = `<p>${word}</p>`;
  wordDiv.classList.add('word');
  wordDiv.style.top = '-2px';
  wordDiv.style.zIndex = '1';
  wordDiv.style.left = (Math.random() * (gameWidth - 150)).toString() + 'px';
  arrWordsDiv.push(wordDiv);
  gameContentClass[0].appendChild(wordDiv);
}

function generateRandomWord(words) {
  return words[Math.floor(Math.random() * words.length)];
}

// FALLING LOGIC
function updateWordPosition() {
  setInterval(() => {
    if (!gameOver) {
      let wordText = document.getElementsByClassName('word');
      for (let i = 0; i < arrWords.length; i++) {
        if (parseInt(topVal) + 15 > gameHeight) {
          endGame();
        } else {
          topVal = wordText[i].style.top;
          topVal.replace('px', '');
          wordText[i].style.top = (parseInt(topVal) + 1).toString() + 'px';
        }
      }
    }
  }, 20);
}

function endGame() {
  gameOver = true;

  // Stop Recording only if user consented
  if (hasUserConsented() && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (recognition) {
    recognition.stop();
  }

  gameContentID.innerHTML = modalGameOver();
  playSound(gameoverSound, 8, startGameSound);
  gameoverSound.style.zIndex = 1;
  inputElementID.setAttribute('disabled', true);
  inputElementID.value = "GAME OVER";
}

function updateScore() {
  score += 10;
  scoreElementID.innerHTML = `<p>Score ${score}</p>`;
}

function playSound(sound, time, stopSound) {
  let playPromise = sound.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        stopSound.pause();
        sound.pause();
        stopSound.currentTime = 0;
      })
      .then(() => {
        sound.currentTime = time;
      })
      .then(() => {
        sound.play();
      });
  }
}

function showLevel() {
  if (LEVEL === '3000') {
    levelElementID.innerHTML = `<p>Level: EASY</p>`;
  } else if (LEVEL === '2000') {
    levelElementID.innerHTML = `<p>Level: MEDIUM</p>`;
  } else {
    levelElementID.innerHTML = `<p>Level: HARD</p>`;
  }
}

// GAMEOVER MODAL WITH UPLOAD
function modalGameOver() {
  const hasConsent = hasUserConsented();

  const debugInfo = hasConsent ? `
    <p style="color: white; font-size: 12px; margin-top: 10px;">
      Debug: ${audioChunks.length} audio chunks, ${sessionMetadata.length} phrases recorded
    </p>
  ` : '';

  const actionButtons = hasConsent ? `
    <button id="UploadData" class="my-2 btn-modal" onclick="uploadSessionData()" style="background-color: #28a745;">
      <h6>Submit Session Data</h6>
    </button>
  ` : `
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 20px 0;">
      No data was collected (you did not consent to recording)
    </p>
  `;

  return `
    <div class="modal-gameover col-8" id="game-over-container">
      <h1> Game Over </h2>
      <h2> Score: ${score} </h2>
      ${debugInfo}
      
      ${actionButtons}

      <button id="Restart" class="my-2 btn-modal">
        <a href="game.html?lvl=${currentLevel}">
          <h6>Restart</h6>
        </a>
      </button>
      <button id="Menu" class="my-2 btn-modal">
        <a href="index.html">
          <h6>Back to menu</h6>
        </a>
      </button>
    </div>
  `;
}

// DOWNLOAD FUNCTION
// UPLOAD FUNCTION
async function uploadSessionData() {
  console.log("=== UPLOAD STARTED ===");

  if (audioChunks.length === 0) {
    console.warn("No audio data recorded.");
    return;
  }

  // Visual Feedback: Uploading
  const modalContainer = document.querySelector(".modal-gameover");
  const uploadStatusDiv = document.createElement("div");
  uploadStatusDiv.id = "upload-status";
  uploadStatusDiv.style.marginTop = "20px";
  uploadStatusDiv.innerHTML = `
    <div class="spinner-border text-light" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="text-white mt-2">Uploading session data...</p>
  `;
  // Remove existing buttons to prevent double submission or navigation
  const existingButtons = modalContainer.querySelectorAll("button");
  existingButtons.forEach(btn => btn.style.display = "none");

  modalContainer.appendChild(uploadStatusDiv);

  try {
    // 1. Prepare Data
    const userMeta = getUserMetadata();
    const enrichedData = {
      user_metadata: {
        user_id: userMeta.userId,
        sex: userMeta.sex,
        age: userMeta.age,
        stress_level: userMeta.stressLevel,
        nationality: userMeta.nationality,
        mother_tongue: userMeta.motherTongue,
        consent_timestamp: userMeta.consentTimestamp
      },
      session_info: {
        level: LEVEL,
        start_time: startTime,
        end_time: Date.now(),
        duration_ms: Date.now() - startTime,
        total_score: score,
        phrases_matched: sessionMetadata.length
      },
      phrase_events: sessionMetadata
    };

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    // 2. Create FormData
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(enrichedData));
    formData.append('audio', audioBlob, 'session_audio.webm');

    // 3. Send Request
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();
    console.log("Upload successful:", result);

    // 4. Success UI
    uploadStatusDiv.innerHTML = `
      <h3 style="color: #28a745;">✅ Upload Complete!</h3>
      <p class="text-white">Session ID: ${result.session_id}</p>
      <button id="Restart" class="my-2 btn-modal" onclick="window.location.href='game.html?lvl=${currentLevel}'">
        <h6>Play Again</h6>
      </button>
      <button id="Menu" class="my-2 btn-modal" onclick="window.location.href='index.html'">
        <h6>Back to Menu</h6>
      </button>
    `;

  } catch (err) {
    console.error("Upload failed:", err);

    // Error UI
    uploadStatusDiv.innerHTML = `
      <h3 style="color: #dc3545;">❌ Upload Failed</h3>
      <p class="text-white">${err.message}</p>
      <button class="btn btn-outline-light btn-sm mt-2" onclick="location.reload()">Try Again</button>
    `;
  }
};

init();
