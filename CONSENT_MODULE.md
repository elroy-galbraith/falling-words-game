# Consent Module Documentation

## Overview
The Falling Words game now includes a comprehensive consent module for ethical data collection. Users can opt-in to participate in research data collection or decline and still play the game normally.

## Features

### 1. **Consent Modal**
- Appears automatically when the game loads
- Beautiful, modern UI with glassmorphism effects
- Clear explanation of what data will be collected
- Two options: Consent or Decline

### 2. **User Metadata Collection**
When users consent, they provide:
- **Sex/Gender**: Male, Female, Non-binary, or Prefer not to say
- **Age**: Numeric input (5-120)
- **Current Stress Level**: 1-5 scale (1=Relaxed, 5=Very Stressed)
- **Nationality**: Text input
- **Mother Tongue**: Text input (first language)

### 3. **UUID Generation**
- Each consenting user receives a unique UUID (v4)
- This UUID is attached to all their data
- Allows tracking sessions without personal identification

### 4. **Conditional Recording**
- **If user consents**: Audio recording + gameplay data collection enabled
  - Microphone status: "Microphone: Listening (REC)" in green
  - Download button available at game over
  
- **If user declines**: No recording, gameplay only
  - Microphone status: "Microphone: Listening (No Recording)" in orange
  - No download button at game over
  - Message: "No data was collected (you did not consent to recording)"

### 5. **Enriched Data Export**
When users download their session data, the ZIP file contains:

#### `session_metadata.json` structure:
```json
{
  "user_metadata": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "sex": "female",
    "age": 30,
    "stress_level": 2,
    "nationality": "Japanese",
    "mother_tongue": "Japanese",
    "consent_timestamp": "2025-12-02T04:30:00.000Z"
  },
  "session_info": {
    "level": "3000",
    "start_time": 1733112600000,
    "end_time": 1733112650000,
    "duration_ms": 50000,
    "total_score": 120,
    "phrases_matched": 12
  },
  "phrase_events": [
    {
      "phrase": "hello world",
      "timestamp": 5234,
      "pressure_metric": 0.3456,
      "level": "3000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    // ... more events
  ]
}
```

#### `session_audio.webm`
- Complete audio recording of the gameplay session
- WebM format with Opus codec (when supported)

## Implementation Details

### Files Added
1. **`consent.js`**: Core consent module logic
   - UUID generation
   - Modal display and form handling
   - Metadata storage
   - Helper functions for checking consent status

2. **`css/consent.css`**: Styling for consent modal
   - Modern gradient design
   - Glassmorphism effects
   - Smooth animations
   - Responsive layout

### Modified Files
1. **`game.html`**: 
   - Added consent.css link
   - Added consent.js script (loaded before app.js)

2. **`app.js`**:
   - Modified `init()` to show consent modal first
   - Conditional recording setup based on consent
   - Updated `endGame()` to check consent before stopping recorder
   - Enhanced `modalGameOver()` to conditionally show download button
   - Enriched `downloadDataset()` to include user metadata

## User Flow

### Consent Flow
```
Game Loads
    ↓
Consent Modal Appears
    ↓
    ├─→ User Fills Form & Consents
    │       ↓
    │   UUID Generated
    │       ↓
    │   Recording Starts
    │       ↓
    │   Game Plays (with recording)
    │       ↓
    │   Game Over
    │       ↓
    │   Download Button Available
    │       ↓
    │   Enriched Data Downloaded
    │
    └─→ User Declines
            ↓
        No Recording Setup
            ↓
        Game Plays (no recording)
            ↓
        Game Over
            ↓
        No Download Button
```

## Privacy & Ethics

### Data Collected (with consent)
- Audio recording of gameplay
- Gameplay metrics (phrases, timing, pressure)
- Demographic information (age, sex, nationality, language)
- Stress level self-assessment

### Data NOT Collected
- No personally identifiable information (names, emails, etc.)
- No IP addresses or device fingerprinting
- No tracking cookies

### User Rights
- ✅ Right to decline participation
- ✅ Can still play without consenting
- ✅ Clear explanation of data collection
- ✅ Full control over their data
- ✅ Download their own data

## Technical Notes

### Browser Compatibility
- Requires modern browser with:
  - Web Speech API (Chrome recommended)
  - MediaRecorder API
  - getUserMedia API
- Consent modal works on all modern browsers

### Data Format
- Audio: WebM with Opus codec (fallback to browser default)
- Metadata: JSON format
- Package: ZIP file

### UUID Format
- Version 4 (random) UUID
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Example: `550e8400-e29b-41d4-a716-446655440000`

## Testing

The consent module has been tested for:
1. ✅ Modal appearance on game load
2. ✅ Form validation (all fields required)
3. ✅ Consent flow (recording enabled)
4. ✅ Decline flow (no recording)
5. ✅ Download button visibility based on consent
6. ✅ Data enrichment with user metadata
7. ✅ UUID generation and attachment

## Future Enhancements

Potential improvements:
- Add consent expiration (re-consent after X days)
- Multi-language support for consent form
- Export consent receipt for users
- Analytics dashboard for researchers
- Batch upload to research database
- Additional demographic fields (education, occupation, etc.)

## Support

For questions or issues with the consent module, please refer to the main project documentation or contact the development team.
