// Sets up the SQLite database connection and makes sure the schema exists.
// better-sqlite3 is synchronous, which keeps the rest of the code simple:
// no async/await needed just to talk to the database.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data.sqlite");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema.sql once on startup. All statements use "IF NOT EXISTS",
// so this is safe to run every time the server starts.
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

module.exports = db;
