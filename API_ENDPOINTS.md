# API Endpoints

## Data Export & Statistics

### 1. Export All Data (Admin Only)

**Endpoint:** `GET /api/export`

**Purpose:** Download all session data (database + audio files) as a ZIP file

**Authentication:** Requires admin key

**Usage:**

```bash
# Local development
http://localhost:3000/api/export?key=your-secret-key-here

# Production (Railway)
https://your-app.railway.app/api/export?key=your-secret-key-here
```

**Response:** ZIP file containing:

- `game_data.db` - SQLite database with all sessions and user metadata
- `uploads/` - Directory with all audio recordings (.webm files)

**Security Notes:**

- Change the default `ADMIN_KEY` before deploying!
- Set `ADMIN_KEY` as an environment variable in Railway
- Keep this key secret - anyone with it can download all data

---

### 2. Quick Statistics (Public)

**Endpoint:** `GET /api/stats`

**Purpose:** Get basic statistics about data collection

**Authentication:** None required

**Usage:**

```bash
# Local development
http://localhost:3000/api/stats

# Production (Railway)
https://your-app.railway.app/api/stats
```

**Response:**

```json
{
  "totalSessions": 42,
  "audioFiles": 42
}
```

---

### 3. Submit Session Data

**Endpoint:** `POST /api/submit`

**Purpose:** Upload session data from game (called automatically by app.js)

**Authentication:** None (public endpoint for players)

**Request:** FormData with:

- `metadata` - JSON string with user info, session stats, phrase events
- `audio` - WebM audio blob

**Response:**

```json
{
  "success": true,
  "session_id": 123
}
```

---

## Setting Up Admin Key for Railway

1. Go to your Railway project dashboard
2. Navigate to **Variables** tab
3. Add a new variable:
   - **Key:** `ADMIN_KEY`
   - **Value:** `your-secure-random-key-here` (use a strong password generator)
4. Redeploy your app

Now you can export data using:

```
https://your-app.railway.app/api/export?key=your-secure-random-key-here
```

---

## Example: Downloading Data

**From Browser:**
Just visit the URL with your admin key - the ZIP will download automatically.

**From Command Line:**

```bash
# Using curl
curl -o data-export.zip "https://your-app.railway.app/api/export?key=YOUR_KEY"

# Using wget
wget -O data-export.zip "https://your-app.railway.app/api/export?key=YOUR_KEY"
```

**From Python:**

```python
import requests

ADMIN_KEY = "your-secure-key"
url = f"https://your-app.railway.app/api/export?key={ADMIN_KEY}"

response = requests.get(url)
with open('data-export.zip', 'wb') as f:
    f.write(response.content)
```
