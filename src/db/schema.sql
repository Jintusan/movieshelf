CREATE TABLE IF NOT EXISTS users ( -- Tabelle users, nur anlegen wenn sie fehlt
  id            INTEGER PRIMARY KEY AUTOINCREMENT, -- eindeutige Nummer, zählt automatisch hoch
  username      TEXT NOT NULL UNIQUE, -- Pflicht, nur einmal erlaubt
  email         TEXT NOT NULL UNIQUE, -- Pflicht, nur einmal erlaubt
  passwordHash  TEXT NOT NULL, -- bcrypt-Hash, nie das echte Passwort
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- nur user oder admin
  createdAt     TEXT NOT NULL DEFAULT (datetime('now')) -- Erstellzeit automatisch
);

CREATE TABLE IF NOT EXISTS watchlist ( -- Tabelle watchlist
  id        INTEGER PRIMARY KEY AUTOINCREMENT, -- eindeutige Nummer
  userId    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- gehört zu einem User; User weg = Eintrag weg
  movieId   INTEGER NOT NULL, -- TMDB-ID des Films
  addedAt   TEXT NOT NULL DEFAULT (datetime('now')), -- Zeitpunkt automatisch
  UNIQUE (userId, movieId) -- gleicher Film nicht zweimal pro User
);

CREATE TABLE IF NOT EXISTS reviews ( -- Tabelle reviews
  id          INTEGER PRIMARY KEY AUTOINCREMENT, -- eindeutige Nummer
  userId      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Autor; User weg = Review weg
  movieId     INTEGER NOT NULL, -- TMDB-ID des Films
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), -- nur 1 bis 5 Sterne
  reviewText  TEXT, -- Text, darf leer sein
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')), -- erstellt am
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now')), -- zuletzt geändert am
  UNIQUE (userId, movieId) -- eine Review pro User und Film
);

CREATE TABLE IF NOT EXISTS featured ( -- Tabelle featured (Startseiten-Filme)
  id              INTEGER PRIMARY KEY AUTOINCREMENT, -- eindeutige Nummer
  movieId         INTEGER NOT NULL UNIQUE, -- TMDB-ID, jeder Film nur einmal
  addedByUserId   INTEGER NOT NULL REFERENCES users(id), -- welcher Admin hat ihn gesetzt
  addedAt         TEXT NOT NULL DEFAULT (datetime('now')) -- Zeitpunkt automatisch
);