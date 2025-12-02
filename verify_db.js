const db = require('./database');

db.serialize(() => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Users:", rows);
    });

    db.all("SELECT * FROM sessions", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Sessions:", rows);
    });
});
