const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'game_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeSchema();
    }
});

function initializeSchema() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      age INTEGER,
      sex TEXT,
      native_language TEXT,
      stress_level INTEGER,
      consent_timestamp INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Sessions Table
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      level TEXT,
      score INTEGER,
      duration_ms INTEGER,
      phrases_matched INTEGER,
      transcript_data TEXT, -- JSON string of phrase events
      audio_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (user_id)
    )`);

        console.log('Database schema initialized.');
    });
}

module.exports = db;
