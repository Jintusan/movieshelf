// Sets up accounts in the database. The database file itself is not part of
// the repository, so this script is what turns a freshly cloned copy into a
// usable installation.
//
// Two modes:
//
//   npm run seed
//       Demo setup: creates an admin and a regular user with fixed
//       passwords (printed at the end) and puts a few movies into the
//       homepage's "Featured" collection.
//
//   npm run seed -- <username> <email> <password>
//       Creates a single admin account with your own credentials. If the
//       username already exists, that account is promoted to admin and its
//       password is reset to the one given here.
//
// This is also the only way to get an admin account at all: accounts created
// through the registration form are always regular users (see routes/auth.js).
// Running the script twice is safe.

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

// TMDB movie ids for the demo's featured collection. The app never stores
// movie data itself, so these ids are all that is needed - titles, posters
// and ratings are fetched live from TMDB when a page is rendered.
const DEMO_FEATURED_MOVIE_IDS = [
  603,    // The Matrix
  27205,  // Inception
  157336, // Interstellar
];

const DEMO_ACCOUNTS = [
  { username: "admin", email: "admin@example.com", password: "adminpass123", role: "admin" },
  { username: "testuser", email: "testuser@example.com", password: "testpass123", role: "user" },
];

// Creates the account, or promotes/updates it if the username already exists.
// Returns the user's id.
async function createAccount({ username, email, password, role }, { updateExisting }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);

  if (existing && !updateExisting) {
    console.log(`- account "${username}" already exists, left unchanged`);
    return existing.id;
  }

  if (existing) {
    db.prepare("UPDATE users SET role = ?, passwordHash = ? WHERE id = ?")
      .run(role, passwordHash, existing.id);
    console.log(`- existing account "${username}" updated (role: ${role}, password reset)`);
    return existing.id;
  }

  const info = db
    .prepare("INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, ?)")
    .run(username, email, passwordHash, role);
  console.log(`- created ${role} account "${username}" (password: ${password})`);
  return info.lastInsertRowid;
}

async function seedDemo() {
  let adminId = null;
  for (const account of DEMO_ACCOUNTS) {
    const id = await createAccount(account, { updateExisting: false });
    if (account.role === "admin") adminId = id;
  }

  const insertFeatured = db.prepare(
    "INSERT OR IGNORE INTO featured (movieId, addedByUserId) VALUES (?, ?)"
  );
  let added = 0;
  for (const movieId of DEMO_FEATURED_MOVIE_IDS) {
    added += insertFeatured.run(movieId, adminId).changes;
  }
  console.log(`- featured collection: ${added} movie(s) added`);

  console.log("\nDemo data ready. Log in with:");
  DEMO_ACCOUNTS.forEach((a) => console.log(`  ${a.role.padEnd(5)}  ${a.username} / ${a.password}`));
}

async function main() {
  const [username, email, password] = process.argv.slice(2);

  if (!username) {
    await seedDemo();
    return;
  }

  if (!email || !password) {
    console.error("Usage: npm run seed -- <username> <email> <password>");
    console.error("   or: npm run seed                (creates the demo setup)");
    process.exit(1);
  }

  await createAccount(
    { username, email, password, role: "admin" },
    { updateExisting: true }
  );
}

main();
