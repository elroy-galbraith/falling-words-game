// Consent Module for Data Collection
// Generates UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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
