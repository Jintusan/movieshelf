require("dotenv").config(); // .env laden (hier eigentlich nur für DB_PATH nötig)
const bcrypt = require("bcrypt"); // zum Hashen der Passwörter
const db = require("./db"); // unsere Datenbank (legt Tabellen an, falls sie fehlen)

const DEMO_FEATURED_MOVIE_IDS = [ // TMDB-IDs der Demo-Featured-Filme (nur IDs, Titel/Poster kommen live von TMDB)
  603,    // The Matrix
  27205,  // Inception
  157336, // Interstellar
];

const DEMO_ACCOUNTS = [ // die zwei Demo-Accounts
  { username: "admin", email: "admin@example.com", password: "adminpass123", role: "admin" }, // Admin
  { username: "testuser", email: "testuser@example.com", password: "testpass123", role: "user" }, // normaler User
];

async function createAccount({ username, email, password, role }, { updateExisting }) { // legt einen Account an (oder aktualisiert ihn), gibt die User-ID zurück
  const passwordHash = await bcrypt.hash(password, 10); // Passwort hashen (10 Runden, wie in auth.js)
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username); // gibt es den Namen schon?

  if (existing && !updateExisting) { // existiert und wir dürfen nicht ändern?
    console.log(`- account "${username}" already exists, left unchanged`); // Meldung: unverändert gelassen
    return existing.id; // vorhandene ID zurückgeben
  }

  if (existing) { // existiert und wir dürfen ändern?
    db.prepare("UPDATE users SET role = ?, passwordHash = ? WHERE id = ?") // Rolle und Passwort überschreiben
      .run(role, passwordHash, existing.id); // Werte einsetzen
    console.log(`- existing account "${username}" updated (role: ${role}, password reset)`); // Meldung: aktualisiert
    return existing.id; // vorhandene ID zurückgeben
  }

  const info = db // existiert nicht: neu anlegen
    .prepare("INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, ?)") // User einfügen
    .run(username, email, passwordHash, role); // Werte einsetzen
  console.log(`- created ${role} account "${username}" (password: ${password})`); // Meldung: angelegt
  return info.lastInsertRowid; // ID des neuen Users zurückgeben
}

async function seedDemo() { // Modus 1: Demo-Daten anlegen
  let adminId = null; // hier merken wir uns die ID des Admins
  for (const account of DEMO_ACCOUNTS) { // jeden Demo-Account durchgehen
    const id = await createAccount(account, { updateExisting: false }); // anlegen, vorhandene nicht ändern
    if (account.role === "admin") adminId = id; // Admin-ID merken
  }

  const insertFeatured = db.prepare( // vorbereiteter Befehl für Featured
    "INSERT OR IGNORE INTO featured (movieId, addedByUserId) VALUES (?, ?)" // IGNORE: schon vorhanden = keine Fehlermeldung
  );
  let added = 0; // Zähler für neu hinzugefügte Filme
  for (const movieId of DEMO_FEATURED_MOVIE_IDS) { // jede Film-ID durchgehen
    added += insertFeatured.run(movieId, adminId).changes; // einfügen; changes = 1 wenn neu, 0 wenn schon da
  }
  console.log(`- featured collection: ${added} movie(s) added`); // Meldung: so viele neu

  console.log("\nDemo data ready. Log in with:"); // Hinweis mit den Zugangsdaten
  DEMO_ACCOUNTS.forEach((a) => console.log(`  ${a.role.padEnd(5)}  ${a.username} / ${a.password}`)); // Rolle, Name / Passwort ausgeben
}

async function main() { // Startpunkt: entscheidet den Modus
  const [username, email, password] = process.argv.slice(2); // Argumente nach "npm run seed --" lesen

  if (!username) { // keine Argumente?
    await seedDemo(); // Modus 1: Demo-Daten
    return; // fertig
  }

  if (!email || !password) { // Name da, aber E-Mail oder Passwort fehlt?
    console.error("Usage: npm run seed -- <username> <email> <password>"); // Hilfe: so geht's
    console.error("   or: npm run seed                (creates the demo setup)"); // Hilfe: oder ohne Argumente
    process.exit(1); // Programm mit Fehlercode beenden
  }

  await createAccount( // Modus 2: eigener Admin
    { username, email, password, role: "admin" }, // mit den eigenen Daten, Rolle admin
    { updateExisting: true } // vorhandenen Account zum Admin machen und Passwort ändern
  );
}

main(); // Programm starten