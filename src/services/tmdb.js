const TMDB_BASE_URL = "https://api.themoviedb.org/3"; // Basisadresse der TMDB-API
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache gilt 5 Minuten (in ms)

const cache = new Map(); // Zwischenspeicher: Schlüssel -> { data, expiresAt }

function getCached(key) { // Cache lesen
  const entry = cache.get(key); // Eintrag holen
  if (!entry) return null; // nichts gespeichert
  if (Date.now() > entry.expiresAt) { // abgelaufen?
    cache.delete(key); // Eintrag löschen
    return null; // zählt als "nicht vorhanden"
  }
  return entry.data; // noch frisch -> Daten zurück
}

function setCached(key, data) { // Cache schreiben
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS }); // Daten + Ablaufzeit merken
}

async function tmdbFetch(path, params = {}) { // EIN Ort für alle TMDB-Aufrufe
  const apiKey = process.env.TMDB_API_KEY; // Key aus .env
  if (!apiKey) { // Key fehlt?
    throw new Error("TMDB_API_KEY is not set. Copy .env.example to .env and add your key."); // Fehler werfen
  }

  const url = new URL(TMDB_BASE_URL + path); // komplette Adresse bauen
  url.searchParams.set("api_key", apiKey); // ?api_key=... anhängen
  for (const [key, value] of Object.entries(params)) { // alle weiteren Parameter
    url.searchParams.set(key, value); // ...&query=...&page=...
  }

  const response = await fetch(url); // HTTP-Anfrage an TMDB, warten
  if (!response.ok) { // Status nicht 200-299?
    const body = await response.text(); // Fehlertext lesen
    throw new Error(`TMDB request failed (${response.status}): ${body}`); // Fehler werfen
  }
  return response.json(); // Antwort als Objekt zurück
}

function mapMovie(raw) { // TMDB-Film -> unser Film-Objekt
  return {
    id: raw.id, // Number
    title: raw.title, // String
    overview: raw.overview, // String
    releaseDate: raw.release_date || null, // Date ("YYYY-MM-DD"), sonst null
    voteAverage: raw.vote_average, // Number
    voteCount: raw.vote_count, // Number
    popularity: raw.popularity, // Number
    adult: !!raw.adult, // Boolean (!! macht true/false daraus)
    video: !!raw.video, // Boolean
    originalLanguage: raw.original_language, // String
    posterUrl: raw.poster_path // Poster vorhanden?
      ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` // ja: volle Bild-URL
      : null, // nein: null
  };
}

function toDate(movie) { // Datum-String -> echtes Date-Objekt
  return movie.releaseDate ? new Date(movie.releaseDate) : null; // sonst null
}

async function searchMovies(query) { // Filme suchen
  const data = await tmdbFetch("/search/movie", { query, include_adult: "false" }); // Suche ohne Adult
  return data.results.map(mapMovie); // jedes Ergebnis umwandeln
}

async function getPopularMovies(page = 1) { // beliebte Filme (Seite 1)
  const cacheKey = `popular:${page}`; // Cache-Schlüssel
  const cached = getCached(cacheKey); // schon im Cache?
  if (cached) return cached; // ja: kein TMDB-Aufruf nötig

  const data = await tmdbFetch("/movie/popular", { page }); // nein: bei TMDB holen
  const movies = data.results.map(mapMovie); // umwandeln
  setCached(cacheKey, movies); // 5 Minuten merken
  return movies; // zurückgeben
}

async function getMovieById(id) { // ein Film per ID
  const cacheKey = `movie:${id}`; // Cache-Schlüssel
  const cached = getCached(cacheKey); // schon im Cache?
  if (cached) return cached; // ja: kein TMDB-Aufruf nötig

  const raw = await tmdbFetch(`/movie/${id}`); // nein: bei TMDB holen
  const movie = mapMovie(raw); // umwandeln
  setCached(cacheKey, movie); // 5 Minuten merken
  return movie; // zurückgeben
}

module.exports = { searchMovies, getPopularMovies, getMovieById, mapMovie, toDate }; // nach außen freigeben