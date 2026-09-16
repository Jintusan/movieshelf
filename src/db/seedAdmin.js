// One-off CLI script to create (or promote) an admin account.
// Public self-registration only ever creates role "user" (see
// routes/auth.js) - this is the intentional back door to get the first
// admin into the system. Run it once after installing dependencies.
//
// Usage:
//   node src/db/seedAdmin.js <username> <email> <password>

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

async function main() {
  const [username, email, password] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error("Usage: node src/db/seedAdmin.js <username> <email> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);

  if (existing) {
    db.prepare("UPDATE users SET role = 'admin', passwordHash = ? WHERE id = ?").run(
      passwordHash,
      existing.id
    );
    console.log(`Existing user "${username}" was promoted to admin.`);
  } else {
    db.prepare(
      "INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, 'admin')"
    ).run(username, email, passwordHash);
    console.log(`Admin account "${username}" created.`);
  }
}

main();
