// Feature 2 - Personal Watchlist (Role: User)
//
// The database only ever stores the TMDB movie id per (user, movie) pair -
// see src/db/schema.sql. Whenever the watchlist is displayed, we fetch the
// current movie data from TMDB for each stored id, so title/poster/rating
// are always up to date instead of a stale local copy.
//
// Every route here uses requireAuth, so a guest gets a clean 401 instead
// of being able to touch someone's watchlist.

const express = require("express");
const db = require("../db/db");
const tmdb = require("../services/tmdb");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/watchlist  -> the current user's watchlist, with live movie data
router.get("/", async (req, res) => {
  const rows = db
    .prepare("SELECT movieId, addedAt FROM watchlist WHERE userId = ? ORDER BY addedAt DESC")
    .all(req.session.user.id);

  try {
    const items = await Promise.all(
      rows.map(async (row) => ({
        movie: await tmdb.getMovieById(row.movieId),
        addedAt: row.addedAt,
      }))
    );
    res.json({ watchlist: items });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

// POST /api/watchlist  { movieId }  -> add a movie
router.post("/", (req, res) => {
  const movieId = Number(req.body.movieId);
  if (!Number.isInteger(movieId)) {
    return res.status(400).json({ error: "movieId (number) is required." });
  }

  try {
    db.prepare("INSERT INTO watchlist (userId, movieId) VALUES (?, ?)").run(
      req.session.user.id,
      movieId
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Movie is already in your watchlist." });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/watchlist/:movieId  -> remove a movie
router.delete("/:movieId", (req, res) => {
  const movieId = Number(req.params.movieId);
  const result = db
    .prepare("DELETE FROM watchlist WHERE userId = ? AND movieId = ?")
    .run(req.session.user.id, movieId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Movie was not in your watchlist." });
  }
  res.json({ ok: true });
});

module.exports = router;
