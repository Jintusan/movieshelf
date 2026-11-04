const express = require("express"); // Webserver-Bibliothek
const db = require("../db/db"); // Datenbank-Verbindung
const tmdb = require("../services/tmdb"); // TMDB-Funktionen
const { requireAuth } = require("../middleware/auth"); // Wächter: nur eingeloggt

const router = express.Router(); // Mini-Router für /api/watchlist
router.use(requireAuth); // gilt für ALLE Routen hier: ohne Login 401

router.get("/", async (req, res) => { // GET /api/watchlist
  const rows = db // meine Einträge aus der Datenbank
    .prepare("SELECT movieId, addedAt FROM watchlist WHERE userId = ? ORDER BY addedAt DESC") // nur meine, neueste zuerst
    .all(req.session.user.id); // alle Zeilen holen; ? = meine User-ID aus der Session

  try { // Versuch ...
    const items = await Promise.all( // alle Filme gleichzeitig holen
      rows.map(async (row) => ({ // pro Eintrag ein Objekt bauen
        movie: await tmdb.getMovieById(row.movieId), // Filmdaten live von TMDB
        addedAt: row.addedAt, // Zeitpunkt aus der Datenbank
      }))
    );
    res.json({ watchlist: items }); // Liste zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

router.post("/", (req, res) => { // POST /api/watchlist
  const movieId = Number(req.body.movieId); // Film-ID aus dem Body -> Zahl
  if (!Number.isInteger(movieId)) { // keine ganze Zahl?
    return res.status(400).json({ error: "movieId (number) is required." }); // 400 = falsche Eingabe
  }

  try { // Versuch ...
    db.prepare("INSERT INTO watchlist (userId, movieId) VALUES (?, ?)").run( // Eintrag speichern
      req.session.user.id, // meine User-ID aus der Session
      movieId // die Film-ID
    );
    res.status(201).json({ ok: true }); // 201 = erstellt
  } catch (err) { // ... bei Fehler:
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") { // Film schon auf der Liste?
      return res.status(409).json({ error: "Movie is already in your watchlist." }); // 409 = Konflikt
    }
    console.error(err); // anderer Fehler: loggen
    res.status(500).json({ error: "Internal server error." }); // 500 = Serverfehler
  }
});

router.delete("/:movieId", (req, res) => { // DELETE /api/watchlist/603
  const movieId = Number(req.params.movieId); // Film-ID aus der Adresse -> Zahl
  const result = db // Eintrag löschen
    .prepare("DELETE FROM watchlist WHERE userId = ? AND movieId = ?") // nur MEIN Eintrag
    .run(req.session.user.id, movieId); // ausführen

  if (result.changes === 0) { // nichts gelöscht?
    return res.status(404).json({ error: "Movie was not in your watchlist." }); // 404 = nicht gefunden
  }
  res.json({ ok: true }); // Erfolg melden
});

module.exports = router; // Router exportieren