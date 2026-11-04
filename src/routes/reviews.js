const express = require("express"); // Webserver-Bibliothek
const db = require("../db/db"); // Datenbank-Verbindung
const tmdb = require("../services/tmdb"); // TMDB-Funktionen
const { requireAuth } = require("../middleware/auth"); // Wächter: nur eingeloggt

const router = express.Router(); // Mini-Router für /api/reviews

router.get("/movie/:movieId", (req, res) => { // GET /api/reviews/movie/603 (öffentlich, kein Login)
  const movieId = Number(req.params.movieId); // Film-ID aus der Adresse -> Zahl
  const rows = db // alle Reviews zu diesem Film
    .prepare(
      // JOIN verbindet reviews mit users, damit der Username dabei ist; neueste zuerst
      `SELECT reviews.rating, reviews.reviewText, reviews.createdAt, users.username
       FROM reviews JOIN users ON users.id = reviews.userId
       WHERE reviews.movieId = ?
       ORDER BY reviews.createdAt DESC`
    )
    .all(movieId); // alle Zeilen holen; ? = movieId
  res.json({ reviews: rows }); // zurückschicken
});

router.get("/me", requireAuth, async (req, res) => { // GET /api/reviews/me (nur eingeloggt)
  const rows = db // meine Reviews aus der Datenbank
    .prepare("SELECT movieId, rating, reviewText, createdAt FROM reviews WHERE userId = ?") // nur meine
    .all(req.session.user.id); // ? = meine User-ID aus der Session

  try { // Versuch ...
    const items = await Promise.all( // alle Filme gleichzeitig holen
      rows.map(async (row) => ({ // pro Review ein Objekt bauen
        movie: await tmdb.getMovieById(row.movieId), // Filmdaten live von TMDB
        rating: row.rating, // meine Sterne
        reviewText: row.reviewText, // mein Text
        createdAt: row.createdAt, // Datum
      }))
    );
    res.json({ reviews: items }); // zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

router.post("/", requireAuth, (req, res) => { // POST /api/reviews (nur eingeloggt)
  const movieId = Number(req.body.movieId); // Film-ID -> Zahl
  const rating = Number(req.body.rating); // Sterne -> Zahl
  const reviewText = (req.body.reviewText || "").toString().slice(0, 1000); // Text, leer erlaubt, max. 1000 Zeichen

  if (!Number.isInteger(movieId) || !Number.isInteger(rating) || rating < 1 || rating > 5) { // ungültig?
    return res.status(400).json({ error: "movieId (number) and rating (1-5) are required." }); // 400 = falsche Eingabe
  }

  db.prepare(
    // Upsert: neu anlegen, ODER bei bestehender Review (gleicher User + Film) aktualisieren
    `INSERT INTO reviews (userId, movieId, rating, reviewText, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(userId, movieId)
     DO UPDATE SET rating = excluded.rating,
                   reviewText = excluded.reviewText,
                   updatedAt = datetime('now')`
  ).run(req.session.user.id, movieId, rating, reviewText); // Werte für die ? einsetzen

  res.status(201).json({ ok: true }); // 201 = gespeichert
});

router.delete("/:movieId", requireAuth, (req, res) => { // DELETE /api/reviews/603 (nur eingeloggt)
  const movieId = Number(req.params.movieId); // Film-ID aus der Adresse -> Zahl
  const result = db // eigene Review löschen
    .prepare("DELETE FROM reviews WHERE userId = ? AND movieId = ?") // nur MEINE Review
    .run(req.session.user.id, movieId); // ausführen

  if (result.changes === 0) { // nichts gelöscht?
    return res.status(404).json({ error: "You have no review for this movie." }); // 404 = nicht gefunden
  }
  res.json({ ok: true }); // Erfolg melden
});

module.exports = router; // Router exportieren