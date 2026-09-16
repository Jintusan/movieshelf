// One small module that wraps every call to the TMDB REST API.
//
// Why centralise it here instead of calling fetch() from each route file:
//   - the API key is read from process.env once, here, and never sent to
//     the browser (the frontend only ever talks to OUR /api/... routes)
//   - all TMDB calls are async (fetch), matching the "asynchronous
//     client-server / server-to-API communication" requirement
//   - a tiny in-memory cache avoids hitting TMDB again for a movie we
//     already fetched a few minutes ago (relevant for the watchlist and
//     featured list, which look up several movie ids on every page view)

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// key -> { data, expiresAt }
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function tmdbFetch(path, params = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set. Copy .env.example to .env and add your key.");
  }

  const url = new URL(TMDB_BASE_URL + path);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url); // Node 18+ has fetch built in.
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TMDB request failed (${response.status}): ${body}`);
  }
  return response.json();
}

// Converts one TMDB movie object into the shape our app actually uses.
// This is also the one place that documents which TMDB fields we rely on
// (see the concept document's Resource Description table) and where the
// TMDB date string gets turned into a real Date when needed.
function mapMovie(raw) {
  return {
    id: raw.id,                                   // Number
    title: raw.title,                              // String
    overview: raw.overview,                        // String
    releaseDate: raw.release_date || null,         // Date (ISO string "YYYY-MM-DD")
    voteAverage: raw.vote_average,                  // Number
    voteCount: raw.vote_count,                      // Number
    popularity: raw.popularity,                     // Number
    adult: !!raw.adult,                             // Boolean
    video: !!raw.video,                             // Boolean
    originalLanguage: raw.original_language,        // String
    posterUrl: raw.poster_path
      ? `https://image.tmdb.org/t/p/w342${raw.poster_path}`
      : null,
  };
}

// Turns the stored ISO date string into a real JS Date object, e.g. for
// sorting a list of movies by release date.
function toDate(movie) {
  return movie.releaseDate ? new Date(movie.releaseDate) : null;
}

async function searchMovies(query) {
  const data = await tmdbFetch("/search/movie", { query, include_adult: "false" });
  return data.results.map(mapMovie);
}

async function getPopularMovies(page = 1) {
  const cacheKey = `popular:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await tmdbFetch("/movie/popular", { page });
  const movies = data.results.map(mapMovie);
  setCached(cacheKey, movies);
  return movies;
}

async function getMovieById(id) {
  const cacheKey = `movie:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await tmdbFetch(`/movie/${id}`);
  const movie = mapMovie(raw);
  setCached(cacheKey, movie);
  return movie;
}

module.exports = { searchMovies, getPopularMovies, getMovieById, mapMovie, toDate };
