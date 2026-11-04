const express = require("express"); // Webserver-Bibliothek
const bcrypt = require("bcrypt"); // Passwörter hashen und prüfen
const db = require("../db/db"); // Datenbank-Verbindung

const router = express.Router(); // eigener Mini-Router für /api/auth
const SALT_ROUNDS = 10; // Stärke des Hashings

router.post("/register", async (req, res) => { // POST /api/auth/register
  const { username, email, password } = req.body; // Daten aus der Anfrage holen

  if (!username || !email || !password) { // etwas fehlt?
    return res.status(400).json({ error: "username, email and password are all required." }); // 400 = falsche Eingabe
  }
  if (password.length < 6) { // Passwort zu kurz?
    return res.status(400).json({ error: "Password must be at least 6 characters long." }); // 400
  }

  const existing = db // gibt es den User schon?
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?") // SQL, ? = Platzhalter (gegen SQL-Injection)
    .get(username, email); // eine Zeile holen, Werte für die ?
  if (existing) { // gefunden?
    return res.status(409).json({ error: "Username or email is already taken." }); // 409 = Konflikt
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS); // Passwort -> Hash (dauert, darum await)

  const info = db // User speichern
    .prepare("INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, 'user')") // Rolle immer 'user'
    .run(username, email, passwordHash); // ausführen

  req.session.user = { id: info.lastInsertRowid, username, role: "user" }; // direkt einloggen
  res.status(201).json({ user: req.session.user }); // 201 = erstellt, User zurückgeben
});

router.post("/login", async (req, res) => { // POST /api/auth/login
  const { username, password } = req.body; // Daten aus der Anfrage holen
  if (!username || !password) { // etwas fehlt?
    return res.status(400).json({ error: "username and password are required." }); // 400
  }

  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username); // User per Name suchen
  if (!row) { // nicht gefunden?
    return res.status(401).json({ error: "Invalid username or password." }); // 401, gleiche Meldung wie bei falschem Passwort
  }

  const passwordMatches = await bcrypt.compare(password, row.passwordHash); // Passwort gegen Hash prüfen
  if (!passwordMatches) { // falsches Passwort?
    return res.status(401).json({ error: "Invalid username or password." }); // 401
  }

  req.session.user = { id: row.id, username: row.username, role: row.role }; // eingeloggt: in Session speichern
  res.json({ user: req.session.user }); // User zurückgeben
});

router.post("/logout", (req, res) => { // POST /api/auth/logout
  req.session.destroy(() => { // Session auf dem Server löschen
    res.clearCookie("connect.sid"); // Cookie im Browser löschen
    res.json({ ok: true }); // Erfolg melden
  });
});

router.get("/me", (req, res) => { // GET /api/auth/me
  res.json({ user: req.session.user || null }); // eingeloggter User oder null
});

module.exports = router; // Router exportieren