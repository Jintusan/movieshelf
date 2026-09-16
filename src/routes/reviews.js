// Feature 3 - Personal Rating & Review (Role: User to write, everyone to read)
//
// Design decision (see feedback on the concept document): reviews are
// public on the movie detail page, like on IMDb/Letterboxd - anyone can
// read them, but only a logged-in user can write one, and only about
// their own review (one review per user per movie; submitting again
// updates it instead of creating a second row - enforced by the UNIQUE
// (userId, movieId) constraint in schema.sql together with "INSERT ...
// ON CONFLICT ... DO UPDATE" below).

const express = require("express");
const db = require("../db/db");
const tmdb = require("../services/tmdb");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/reviews/movie/:movieId -> public: all reviews for one movie
router.get("/movie/:movieId", (req, res) => {
  const movieId = Number(req.params.movieId);
  const rows = db
    .prepare(
      `SELECT reviews.rating, reviews.reviewText, reviews.createdAt, users.username
       FROM reviews JOIN users ON users.id = reviews.userId
       WHERE reviews.movieId = ?
       ORDER BY reviews.createdAt DESC`
    )
    .all(movieId);
  res.json({ reviews: rows });
});

// GET /api/reviews/me -> the logged-in user's own reviews, with live movie data
router.get("/me", requireAuth, async (req, res) => {
  const rows = db
    .prepare("SELECT movieId, rating, reviewText, createdAt FROM reviews WHERE userId = ?")
    .all(req.session.user.id);

  try {
    const items = await Promise.all(
      rows.map(async (row) => ({
        movie: await tmdb.getMovieById(row.movieId),
        rating: row.rating,
        reviewText: row.reviewText,
        createdAt: row.createdAt,
      }))
    );
    res.json({ reviews: items });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

// POST /api/reviews  { movieId, rating, reviewText } -> create or update own review
router.post("/", requireAuth, (req, res) => {
  const movieId = Number(req.body.movieId);
  const rating = Number(req.body.rating);
  const reviewText = (req.body.reviewText || "").toString().slice(0, 1000);

  if (!Number.isInteger(movieId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "movieId (number) and rating (1-5) are required." });
  }

  db.prepare(
    `INSERT INTO reviews (userId, movieId, rating, reviewText, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(userId, movieId)
     DO UPDATE SET rating = excluded.rating,
                   reviewText = excluded.reviewText,
                   updatedAt = datetime('now')`
  ).run(req.session.user.id, movieId, rating, reviewText);

  res.status(201).json({ ok: true });
});

// DELETE /api/reviews/:movieId -> remove own review
router.delete("/:movieId", requireAuth, (req, res) => {
  const movieId = Number(req.params.movieId);
  const result = db
    .prepare("DELETE FROM reviews WHERE userId = ? AND movieId = ?")
    .run(req.session.user.id, movieId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "You have no review for this movie." });
  }
  res.json({ ok: true });
});

module.exports = router;
