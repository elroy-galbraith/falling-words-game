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

  // Stop Recording
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
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

// GAMEOVER MODAL WITH DOWNLOAD
function modalGameOver() {
  const debugInfo = `
    <p style="color: white; font-size: 12px; margin-top: 10px;">
      Debug: ${audioChunks.length} audio chunks, ${sessionMetadata.length} phrases recorded
    </p>
  `;

  return `
    <div class="modal-gameover col-8" id="game-over-container">
      <h1> Game Over </h2>
      <h2> Score: ${score} </h2>
      ${debugInfo}
      
      <button id="DownloadData" class="my-2 btn-modal" onclick="downloadDataset()" style="background-color: #28a745;">
        <h6>Download Session Data</h6>
      </button>

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
window.downloadDataset = function () {
  console.log("Attempting to download data...");

  if (audioChunks.length === 0) {
    alert("No audio data recorded. Did you allow microphone access?");
    console.warn("Audio chunks are empty.");
    return;
  }

  const zip = new JSZip();

  // Add Metadata
  const metadataStr = JSON.stringify(sessionMetadata, null, 2);
  zip.file("session_metadata.json", metadataStr);
  console.log("Added metadata to zip:", sessionMetadata.length, "entries");

  // Add Audio
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  zip.file("session_audio.webm", audioBlob);
  console.log("Added audio to zip. Size:", audioBlob.size, "bytes");

  // Generate and Download
  zip.generateAsync({ type: "blob" }).then(function (content) {
    console.log("Zip generated. Size:", content.size);
    const a = document.createElement("a");
    const url = URL.createObjectURL(content);
    a.href = url;
    a.download = `falling_words_session_${Date.now()}.zip`;

    // Required for Firefox and some Chrome versions
    document.body.appendChild(a);
    a.click();

    // Fallback: Create a visible link in case auto-download fails
    const fallbackLink = document.createElement("a");
    fallbackLink.href = url;
    fallbackLink.download = a.download;
    fallbackLink.textContent = "Click here if download didn't start";
    fallbackLink.style.display = "block";
    fallbackLink.style.marginTop = "20px";
    fallbackLink.style.color = "#4CAF50";
    fallbackLink.style.fontSize = "18px";
    fallbackLink.style.fontWeight = "bold";
    fallbackLink.style.textDecoration = "underline";
    fallbackLink.style.cursor = "pointer";

    // Append to the modal if it exists
    const modal = document.querySelector(".modal-gameover");
    if (modal) {
      // Remove any existing fallback links
      const existing = modal.querySelector("a[download]");
      if (existing) existing.remove();
      modal.appendChild(fallbackLink);
    } else {
      // Fallback to body if modal is gone for some reason
      fallbackLink.style.position = "fixed";
      fallbackLink.style.bottom = "20px";
      fallbackLink.style.left = "50%";
      fallbackLink.style.transform = "translateX(-50%)";
      fallbackLink.style.zIndex = "9999";
      fallbackLink.style.backgroundColor = "white";
      fallbackLink.style.padding = "10px";
      fallbackLink.style.border = "2px solid black";
      document.body.appendChild(fallbackLink);
    }

    // Cleanup (only remove the hidden anchor, keep the blob URL valid for the visible link)
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);

    // Method 2: Open in new tab as backup (user can Ctrl+S or right-click save)
    setTimeout(() => {
      window.open(url, '_blank');

      // Create instruction message
      const modal = document.querySelector(".modal-gameover");
      if (modal) {
        const instruction = document.createElement("div");
        instruction.id = "download-instructions";
        instruction.style.cssText = `
          color: #FFD700;
          background: rgba(0,0,0,0.7);
          padding: 15px;
          margin-top: 20px;
          border-radius: 5px;
          font-size: 14px;
          line-height: 1.5;
        `;
        instruction.innerHTML = `
          <strong>📥 Download Instructions:</strong><br>
          1. A new tab opened with your data<br>
          2. In that tab, press <strong>Ctrl+S</strong> to save<br>
          3. Or right-click and "Save as..."<br>
          4. Filename: <code>falling_words_session_${Date.now()}.zip</code>
        `;

        // Remove any existing instructions
        const existingInst = modal.querySelector("#download-instructions");
        if (existingInst) existingInst.remove();

        modal.appendChild(instruction);
      }
    }, 800);
  }).catch(function (err) {
    console.error("Error generating zip:", err);
    alert("Failed to generate download package: " + err.message);
  });
};

init();
