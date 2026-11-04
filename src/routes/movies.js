const express = require("express"); // Webserver-Bibliothek
const tmdb = require("../services/tmdb"); // unsere TMDB-Funktionen

const router = express.Router(); // Mini-Router für /api/movies

router.get("/popular", async (req, res) => { // GET /api/movies/popular
  try { // Versuch ...
    const movies = await tmdb.getPopularMovies(); // beliebte Filme holen
    res.json({ movies }); // als JSON zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

router.get("/search", async (req, res) => { // GET /api/movies/search?q=...
  const query = req.query.q; // Suchbegriff aus der Adresse
  if (!query) { // keiner angegeben?
    return res.status(400).json({ error: "Query parameter 'q' is required." }); // 400 = falsche Eingabe
  }
  try { // Versuch ...
    const movies = await tmdb.searchMovies(query); // bei TMDB suchen
    res.json({ movies }); // Treffer zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

router.get("/:id", async (req, res) => { // GET /api/movies/603 (:id = Platzhalter)
  const id = Number(req.params.id); // Text aus der Adresse -> Zahl
  if (!Number.isInteger(id)) { // keine ganze Zahl?
    return res.status(400).json({ error: "Movie id must be a number." }); // 400 = falsche Eingabe
  }
  try { // Versuch ...
    const movie = await tmdb.getMovieById(id); // einen Film holen
    res.json({ movie }); // zurückschicken
  } catch (err) { // ... bei Fehler:
    console.error(err); // in der Konsole loggen
    res.status(502).json({ error: "Could not reach TMDB." }); // 502 = TMDB nicht erreichbar
  }
});

module.exports = router; // Router exportieren