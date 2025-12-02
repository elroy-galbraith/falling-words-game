const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple auth - change this secret!
const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Configure Multer for audio uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename: session_{timestamp}_{random}.webm
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
    }
});

const upload = multer({ storage: storage });

// API Endpoint to submit session data
app.post('/api/submit', upload.single('audio'), (req, res) => {
    try {
        console.log('Received submission request');

        // Parse metadata from the request body
        // Note: When using multer, non-file fields are available in req.body
        const metadataStr = req.body.metadata;
        if (!metadataStr) {
            return res.status(400).json({ error: 'Missing metadata' });
        }

        const metadata = JSON.parse(metadataStr);
        const userMeta = metadata.user_metadata;
        const sessionInfo = metadata.session_info;
        const phraseEvents = metadata.phrase_events;

        const audioFilename = req.file ? req.file.filename : null;

        // 1. Insert or Update User
        // We use INSERT OR IGNORE or INSERT OR REPLACE depending on requirement.
        // Since user_id is consistent, we can just ensure they exist.
        const userStmt = db.prepare(`
      INSERT OR REPLACE INTO users (user_id, age, sex, native_language, stress_level, consent_timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        userStmt.run(
            userMeta.user_id,
            userMeta.age,
            userMeta.sex,
            userMeta.mother_tongue, // Mapping 'mother_tongue' to 'native_language'
            userMeta.stress_level,
            userMeta.consent_timestamp,
            (err) => {
                if (err) {
                    console.error('Error saving user:', err);
                    return res.status(500).json({ error: 'Database error saving user' });
                }

                // 2. Insert Session
                const sessionStmt = db.prepare(`
          INSERT INTO sessions (user_id, level, score, duration_ms, phrases_matched, transcript_data, audio_filename)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

                sessionStmt.run(
                    userMeta.user_id,
                    sessionInfo.level,
                    sessionInfo.total_score,
                    sessionInfo.duration_ms,
                    sessionInfo.phrases_matched,
                    JSON.stringify(phraseEvents),
                    audioFilename,
                    function (err) {
                        if (err) {
                            console.error('Error saving session:', err);
                            return res.status(500).json({ error: 'Database error saving session' });
                        }

                        console.log(`Session saved successfully. ID: ${this.lastID}, Audio: ${audioFilename}`);
                        res.json({ success: true, session_id: this.lastID });
                    }
                );
                sessionStmt.finalize();
            }
        );
        userStmt.finalize();

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download all data as zip
app.get('/api/export', (req, res) => {
    // Basic auth check
    if (req.query.key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`voicefall-export-${Date.now()}.zip`);
    archive.pipe(res);

    // Add database file
    archive.file('game_data.db', { name: 'game_data.db' });

    // Add all uploads
    archive.directory('uploads/', 'uploads');

    archive.finalize();
});

// Quick stats endpoint (no auth, no sensitive data)
app.get('/api/stats', (req, res) => {
    db.get(`SELECT COUNT(*) as sessions FROM sessions`, (err, row) => {
        const uploadsDir = './uploads';
        const fileCount = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0;
        res.json({
            totalSessions: row?.sessions || 0,
            audioFiles: fileCount
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
