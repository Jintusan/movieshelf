// Auth routes: register, login, logout, and "who am I".
//
// Passwords are never stored as plain text - bcrypt.hash() turns the
// password into a one-way hash before it ever touches the database, and
// bcrypt.compare() checks a login attempt against that hash without ever
// needing to store or recover the original password.

const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db/db");

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register  { username, email, password }
// SHOULD-criterion: "Allow users to register."
// Every self-registered account gets role "user" - an admin account is
// created separately with the seed script (see README).
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existing) {
    return res.status(409).json({ error: "Username or email is already taken." });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const info = db
    .prepare("INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, 'user')")
    .run(username, email, passwordHash);

  // Log the new user in right away, so registration feels like one step.
  req.session.user = { id: info.lastInsertRowid, username, role: "user" };
  res.status(201).json({ user: req.session.user });
});

// POST /api/auth/login  { username, password }
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required." });
  }

  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!row) {
    // Same error for "no such user" and "wrong password" on purpose -
    // this avoids revealing which usernames exist.
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const passwordMatches = await bcrypt.compare(password, row.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  req.session.user = { id: row.id, username: row.username, role: row.role };
  res.json({ user: req.session.user });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/me  -> tells the frontend whether someone is logged in,
// and with which role, so it can show/hide the right buttons.
router.get("/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
