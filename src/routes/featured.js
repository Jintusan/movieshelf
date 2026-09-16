// Feature 4 - Featured Movies Curation (Role: Admin, exclusive)
//
// Managing the list (POST/DELETE) is admin-only via requireAdmin.
// Viewing the resulting homepage section (GET) is public on purpose -
// that part is for every visitor, guests included.

const express = require("express");
const db = require("../db/db");
const tmdb = require("../services/tmdb");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/featured -> public: the current homepage collection
router.get("/", async (req, res) => {
  const rows = db.prepare("SELECT movieId FROM featured ORDER BY addedAt DESC").all();
  try {
    const movies = await Promise.all(rows.map((row) => tmdb.getMovieById(row.movieId)));
    res.json({ featured: movies });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

// POST /api/featured  { movieId } -> admin only: add a movie to the collection
router.post("/", requireAdmin, (req, res) => {
  const movieId = Number(req.body.movieId);
  if (!Number.isInteger(movieId)) {
    return res.status(400).json({ error: "movieId (number) is required." });
  }

  try {
    db.prepare("INSERT INTO featured (movieId, addedByUserId) VALUES (?, ?)").run(
      movieId,
      req.session.user.id
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Movie is already featured." });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/featured/:movieId -> admin only: remove a movie from the collection
router.delete("/:movieId", requireAdmin, (req, res) => {
  const movieId = Number(req.params.movieId);
  const result = db.prepare("DELETE FROM featured WHERE movieId = ?").run(movieId);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Movie is not featured." });
  }
  res.json({ ok: true });
});

module.exports = router;
