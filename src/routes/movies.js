// Feature 1 - Movie Search & Discovery (Role: Guest)
// No auth middleware on these routes on purpose: this is the one feature
// that must work for anyone, logged in or not.

const express = require("express");
const tmdb = require("../services/tmdb");

const router = express.Router();

// GET /api/movies/popular
router.get("/popular", async (req, res) => {
  try {
    const movies = await tmdb.getPopularMovies();
    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

// GET /api/movies/search?q=matrix
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }
  try {
    const movies = await tmdb.searchMovies(query);
    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

// GET /api/movies/:id  -> single movie detail page
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Movie id must be a number." });
  }
  try {
    const movie = await tmdb.getMovieById(id);
    res.json({ movie });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach TMDB." });
  }
});

module.exports = router;
