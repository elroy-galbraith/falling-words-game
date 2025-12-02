# Database Query Instructions

This guide explains how to view the data collected by the Falling Words game (User Consent & Game Sessions).

## Quick Start

We have created a helper script to easily view the database contents.

1. **Open your terminal** (Command Prompt or PowerShell).
2. **Navigate to the project folder** (if you aren't already there).
3. **Run the query script**:

    ```bash
    node query_db.js
    ```

## Understanding the Output

The script will output data in two sections:

### 1. === USERS ===

This list contains the demographic info collected from the consent form.

* `user_id`: Unique identifier for the user.
* `age`, `sex`, `native_language`, `stress_level`: Self-reported data.
* `consent_timestamp`: When they agreed to participate.

### 2. === SESSIONS ===

This list contains the data from each game played.

* `session_id`: Unique ID for that specific game.
* `user_id`: Links back to the User table.
* `score`: Final score.
* `phrases_matched`: How many phrases they successfully spoke.
* `audio_filename`: The name of the recorded audio file.
  * *Note: You can find the actual audio files in the `uploads/` folder.*

## Alternative: Using a GUI

If you prefer a visual interface, you can download a tool like **"DB Browser for SQLite"**.

1. Install [DB Browser for SQLite](https://sqlitebrowser.org/).
2. Open the program and click **"Open Database"**.
3. Select the `game_data.db` file in this project folder.
4. Go to the **"Browse Data"** tab to see the tables.
