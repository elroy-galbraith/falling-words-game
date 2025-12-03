// Consent Module for Data Collection
// Generates UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// localStorage key for consent data
const CONSENT_STORAGE_KEY = 'voicefall_user_consent';

// Save consent to localStorage
function saveConsentToStorage(metadata) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(metadata));
    console.log('Consent saved to localStorage');
    return true;
  } catch (e) {
    console.error('Failed to save consent:', e);
    return false;
  }
}

// Load consent from localStorage
function loadConsentFromStorage() {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Validate required fields
    const requiredFields = ['hasConsented', 'userId', 'sex', 'age', 'stressLevel', 'nationality', 'motherTongue', 'consentTimestamp'];
    const isValid = requiredFields.every(field => parsed[field] !== null && parsed[field] !== undefined);

    if (!isValid || !parsed.hasConsented) {
      console.warn('Invalid or declined consent in storage, clearing');
      clearConsentFromStorage();
      return null;
    }

    console.log('Valid consent loaded from localStorage');
    return parsed;
  } catch (e) {
    console.error('Failed to load consent:', e);
    clearConsentFromStorage();
    return null;
  }
}

// Clear consent from localStorage
function clearConsentFromStorage() {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    console.log('Consent cleared from localStorage');
    return true;
  } catch (e) {
    console.error('Failed to clear consent:', e);
    return false;
  }
}

// User Metadata Storage
let userMetadata = {
  hasConsented: false,
  userId: null,
  sex: null,
  age: null,
  stressLevel: null,
  nationality: null,
  motherTongue: null,
  consentTimestamp: null
};

// Show Consent Modal
function showConsentModal() {
  return new Promise((resolve) => {
    // Check for existing consent first
    const storedConsent = loadConsentFromStorage();
    if (storedConsent) {
      // Auto-populate userMetadata from localStorage
      Object.assign(userMetadata, storedConsent);
      console.log('Auto-loaded consent, skipping modal');
      resolve(userMetadata);
      return; // Skip showing modal entirely
    }

    // If no stored consent, proceed with normal modal display
    console.log("Creating consent overlay...");
    const overlay = document.createElement('div');
    overlay.className = 'consent-overlay';
    overlay.id = 'consent-overlay';

    overlay.innerHTML = `
      <div class="consent-modal">
        <h2>🎮 Research Participation Consent</h2>
        
        <div class="consent-info">
          <p><strong>We're collecting data for speech recognition research!</strong></p>
          <p>If you consent, we will collect:</p>
          <ul>
            <li>Audio recording of your gameplay session</li>
            <li>Gameplay metrics (phrases spoken, timing, pressure)</li>
            <li>Basic demographic information (below)</li>
          </ul>
          <p><strong>You can still play if you decline!</strong> No data will be recorded.</p>
        </div>

        <form id="consent-form" class="consent-form">
          <div class="form-group">
            <label for="sex">Sex/Gender <span class="required-indicator">*</span></label>
            <select id="sex" required>
              <option value="">-- Select --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div class="form-group">
            <label for="age">Age <span class="required-indicator">*</span></label>
            <input type="number" id="age" min="5" max="120" placeholder="Enter your age" required>
          </div>

          <div class="form-group">
            <label>Current Stress Level <span class="required-indicator">*</span></label>
            <div class="stress-scale" id="stress-scale">
              <div class="stress-option" data-value="1">1<br><small>Relaxed</small></div>
              <div class="stress-option" data-value="2">2</div>
              <div class="stress-option" data-value="3">3<br><small>Moderate</small></div>
              <div class="stress-option" data-value="4">4</div>
              <div class="stress-option" data-value="5">5<br><small>Very Stressed</small></div>
            </div>
            <input type="hidden" id="stress-level" required>
          </div>

          <div class="form-group">
            <label for="nationality">Nationality <span class="required-indicator">*</span></label>
            <input type="text" id="nationality" placeholder="e.g., American, Japanese, Nigerian" required>
          </div>

          <div class="form-group">
            <label for="mother-tongue">Mother Tongue / First Language <span class="required-indicator">*</span></label>
            <input type="text" id="mother-tongue" placeholder="e.g., English, Spanish, Mandarin" required>
          </div>

          <div class="consent-buttons">
            <button type="button" class="consent-btn consent-btn-decline" id="decline-btn">
              Decline & Play Anyway
            </button>
            <button type="submit" class="consent-btn consent-btn-accept" id="accept-btn" disabled>
              I Consent - Start Recording
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    console.log("Consent overlay appended to body");

    // Stress level selection
    const stressOptions = overlay.querySelectorAll('.stress-option');
    const stressInput = overlay.querySelector('#stress-level');

    stressOptions.forEach(option => {
      option.addEventListener('click', () => {
        stressOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        stressInput.value = option.dataset.value;
        validateForm();
      });
    });

    // Form validation
    const form = overlay.querySelector('#consent-form');
    const acceptBtn = overlay.querySelector('#accept-btn');
    const inputs = form.querySelectorAll('input[required], select[required]');

    function validateForm() {
      let allValid = true;
      inputs.forEach(input => {
        if (!input.value || input.value === '') {
          allValid = false;
        }
      });
      acceptBtn.disabled = !allValid;
    }

    inputs.forEach(input => {
      input.addEventListener('input', validateForm);
      input.addEventListener('change', validateForm);
    });

    // Decline button
    overlay.querySelector('#decline-btn').addEventListener('click', () => {
      userMetadata.hasConsented = false;
      document.body.removeChild(overlay);
      resolve(userMetadata);
    });

    // Accept button (form submit)
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Generate UUID and collect data
      userMetadata.hasConsented = true;
      userMetadata.userId = generateUUID();
      userMetadata.sex = overlay.querySelector('#sex').value;
      userMetadata.age = parseInt(overlay.querySelector('#age').value);
      userMetadata.stressLevel = parseInt(overlay.querySelector('#stress-level').value);
      userMetadata.nationality = overlay.querySelector('#nationality').value.trim();
      userMetadata.motherTongue = overlay.querySelector('#mother-tongue').value.trim();
      userMetadata.consentTimestamp = new Date().toISOString();

      console.log('User consented with metadata:', userMetadata);

      // Save to localStorage
      saveConsentToStorage(userMetadata);

      document.body.removeChild(overlay);
      resolve(userMetadata);
    });
  });
}

// Get user metadata (to be called by app.js)
function getUserMetadata() {
  return userMetadata;
}

// Check if user has consented
function hasUserConsented() {
  return userMetadata.hasConsented;
}

// Reset consent (called from reset button)
function resetConsent() {
  clearConsentFromStorage();
  userMetadata = {
    hasConsented: false,
    userId: null,
    sex: null,
    age: null,
    stressLevel: null,
    nationality: null,
    motherTongue: null,
    consentTimestamp: null
  };
  console.log('Consent reset - will show modal on next game');
}
