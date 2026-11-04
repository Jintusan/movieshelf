const path = require("path"); // Pfade bauen
const fs = require("fs"); // Dateien lesen
const Database = require("better-sqlite3"); // SQLite-Bibliothek

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data.sqlite"); // Datei: data.sqlite im Projektordner

const db = new Database(DB_PATH); // Datenbank öffnen/anlegen
db.pragma("journal_mode = WAL"); // schnellerer Schreibmodus
db.pragma("foreign_keys = ON"); // Fremdschlüssel aktivieren (für CASCADE)

const schemaPath = path.join(__dirname, "schema.sql"); // Pfad zur schema.sql
const schema = fs.readFileSync(schemaPath, "utf8"); // Datei als Text lesen
db.exec(schema); // Tabellen anlegen

module.exports = db; // Verbindung für andere Dateien