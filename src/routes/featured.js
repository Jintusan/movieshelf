const express = require("express"); // Webserver-Bibliothek
const db = require("../db/db"); // Datenbank-Verbindung
const tmdb = require("../services/tmdb"); // TMDB-Funktionen
const { requireAdmin } = require("../middleware/auth"); // Wächter: nur Admins

const router = express.Router(); // Mini-Router für /api/featured

router.get("/", async (req, res) => { // GET /api/featured (öffentlich, kein Login)
  const rows = db.prepare("SELECT movieId FROM featured ORDER BY addedAt DESC").all(); // alle Featured-IDs, neueste zuerst
  try { // Versuch ...
    const movies = await Promise.all(rows.map((row) => tmdb.getMovieById(row.movieId))); // alle Filme gleichzeitig von TMDB holen
    res.json({ featured: movies }); // Liste zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

router.post("/", requireAdmin, (req, res) => { // POST /api/featured (nur Admin)
  const movieId = Number(req.body.movieId); // Film-ID aus dem Body -> Zahl
  if (!Number.isInteger(movieId)) { // keine ganze Zahl?
    return res.status(400).json({ error: "movieId (number) is required." }); // 400 = falsche Eingabe
  }

  try { // Versuch ...
    db.prepare("INSERT INTO featured (movieId, addedByUserId) VALUES (?, ?)").run( // Film als Featured speichern
      movieId, // die Film-ID
      req.session.user.id // welcher Admin es gesetzt hat
    );
    res.status(201).json({ ok: true }); // 201 = erstellt
  } catch (err) { // ... bei Fehler:
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") { // Film schon featured?
      return res.status(409).json({ error: "Movie is already featured." }); // 409 = Konflikt
    }
    console.error(err); // anderer Fehler: loggen
    res.status(500).json({ error: "Internal server error." }); // 500 = Serverfehler
  }
});

router.delete("/:movieId", requireAdmin, (req, res) => { // DELETE /api/featured/603 (nur Admin)
  const movieId = Number(req.params.movieId); // Film-ID aus der Adresse -> Zahl
  const result = db.prepare("DELETE FROM featured WHERE movieId = ?").run(movieId); // Film aus Featured löschen
  if (result.changes === 0) { // nichts gelöscht?
    return res.status(404).json({ error: "Movie is not featured." }); // 404 = nicht gefunden
  }
  res.json({ ok: true }); // Erfolg melden
});

module.exports = router; // Router exportieren