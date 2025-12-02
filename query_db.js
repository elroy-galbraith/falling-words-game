const db = require('./database');

db.serialize(() => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("=== USERS ===");
        console.log(JSON.stringify(rows, null, 2));
    });

    db.all("SELECT * FROM sessions", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("\n=== SESSIONS ===");
        console.log(JSON.stringify(rows, null, 2));
    });
});
