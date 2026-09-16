-- Web Technologies ILV - Compensational Exercise
-- Database schema (SQLite)
--
-- Two resources are managed by this application:
--   1. Users            -> stored fully in this database
--   2. Movie (external) -> comes from the TMDB API, never duplicated here.
--      Only the TMDB movie id is stored, wherever a movie needs to be
--      referenced from user-specific data (watchlist, reviews, featured).

-- Registered accounts. role is either 'user' or 'admin'.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  createdAt     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Feature 2: Personal Watchlist (Role: User)
-- One row = "this user wants to watch this TMDB movie".
CREATE TABLE IF NOT EXISTS watchlist (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movieId   INTEGER NOT NULL,          -- TMDB movie id
  addedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (userId, movieId)             -- can't add the same movie twice
);

-- Feature 3: Personal Rating & Review (Role: User)
-- One row = "this user's rating/review for this TMDB movie".
CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  userId      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movieId     INTEGER NOT NULL,        -- TMDB movie id
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  reviewText  TEXT,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (userId, movieId)             -- one review per user per movie (re-submit = update)
);

-- Feature 4: Featured Movies Curation (Role: Admin, exclusive)
-- One row = "this movie is currently pinned on the homepage".
CREATE TABLE IF NOT EXISTS featured (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  movieId         INTEGER NOT NULL UNIQUE, -- TMDB movie id
  addedByUserId   INTEGER NOT NULL REFERENCES users(id),
  addedAt         TEXT NOT NULL DEFAULT (datetime('now'))
);
