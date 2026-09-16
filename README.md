# MovieApp – Web Technologies ILV, Compensational Exercise

A small web application that lets people search movies (via the TMDB API),
keep a personal watchlist, rate and review movies, and lets admins curate a
"Featured Movies" collection on the homepage. Built to match the approved
concept document (see `Concept_Document_WebTech.docx`).

## Tech stack

- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite (via `better-sqlite3`) — a single file, `data.sqlite`, created automatically on first start
- **Frontend:** plain HTML, CSS and vanilla JavaScript (ES modules), served as static files by Express, talking to the API asynchronously via `fetch()` — no build step, no frontend framework
- **Auth:** session-based login (`express-session`), passwords hashed with `bcrypt`
- **External API:** [The Movie Database (TMDB)](https://www.themoviedb.org/) — movie data (search, popular list, movie details)

## Dependencies and versions

- Node.js **18 or newer** (tested with Node 22) — needed for the built-in `fetch()`
- npm (comes with Node.js)
- No database server needed — SQLite is embedded, no separate installation required

All JavaScript dependencies are listed in `package.json` / `package-lock.json` and are installed with `npm install` (see below): `express`, `express-session`, `better-sqlite3`, `bcrypt`, `dotenv`.

## External API key required

This app calls the TMDB API and needs a personal, free API key:

1. Create a free account at <https://www.themoviedb.org/signup>.
2. Go to **Settings → API** and request a free "Developer" API key (v3 auth).
3. You'll get a key that looks like a long string of letters and numbers — copy it.

Without this key, movie data (search, popular list, movie details, watchlist, reviews, featured list) cannot be loaded; the app will still start and login/registration will still work, but movie-related pages will show an error.

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file from the template
cp .env.example .env
```

Now open `.env` and fill in:

```
TMDB_API_KEY=your_real_tmdb_api_key
SESSION_SECRET=any_long_random_string
PORT=3000
```

## Build instructions

Not applicable — there is no build/compile step. The frontend is plain HTML/CSS/JS served as-is.

## Starting the application

```bash
npm start
```

This starts the Express server (client and server are one and the same process here — Express serves both the REST API under `/api/...` and the static frontend files). By default it runs at:

```
http://localhost:3000
```

Open that URL in a browser.

On first start, a `data.sqlite` file is created automatically and the required tables are set up — no manual database setup needed.

## Creating an admin account

Public registration (`/register.html`) always creates a normal **User** account. To get an **Admin** account (needed for the "Featured Movies" feature), run this once, after `npm install` and after the server has been started at least once (so `data.sqlite` exists):

```bash
npm run seed:admin -- <username> <email> <password>
# example:
npm run seed:admin -- admin admin@example.com adminpass123
```

If the username already exists, it is promoted to admin (its password is also reset to the one you provide). Otherwise a brand-new admin account is created. Log in with these credentials at `/login.html` to access `/admin.html`.

## Environment variables

| Variable         | Required | Description                                                    |
|-------------------|:--------:|------------------------------------------------------------------|
| `TMDB_API_KEY`    | yes      | Your personal TMDB v3 API key (see above)                        |
| `SESSION_SECRET`  | yes      | Any long random string, used to sign the session cookie          |
| `PORT`            | no       | Port the server listens on (default: `3000`)                     |
| `DB_PATH`         | no       | Custom path for the SQLite file (default: `./data.sqlite`)        |

## Roles and features

| Role  | Can do |
|-------|--------|
| Guest  | Search movies, browse popular movies, view movie details, view the Featured Movies section, read reviews |
| User   | Everything Guest can, plus: maintain a personal watchlist, write/edit a personal rating & review |
| Admin  | Everything User can, plus: add/remove movies from the homepage's Featured Movies collection |

## Project structure

```
src/
  server.js            Express app bootstrap (sessions, static files, routes)
  db/
    schema.sql          SQLite table definitions
    db.js                opens data.sqlite and applies schema.sql on startup
    seedAdmin.js         CLI script to create/promote an admin account
  services/
    tmdb.js              wraps all TMDB API calls + a small in-memory cache
  middleware/
    auth.js              requireAuth / requireAdmin route guards
  routes/
    auth.js              register, login, logout, "who am I"
    movies.js             Feature 1: search, popular, movie details (Guest)
    watchlist.js           Feature 2: personal watchlist (User)
    reviews.js              Feature 3: rating & review (User writes, everyone reads)
    featured.js              Feature 4: featured movies (Admin curates, everyone views)
public/
  *.html                 one static page per screen
  css/style.css           shared styling
  js/                      one small ES module per page, plus shared api.js / nav.js helpers
```

## Notes on the external API integration

- All TMDB calls happen **server-side** (`src/services/tmdb.js`) — the API key is read from the environment and never sent to the browser.
- Movie data is **never duplicated** in the local database. The database only stores TMDB movie ids together with user-specific data (which user has it on their watchlist, which user rated it and with what score, which admin featured it). Whenever a page needs to display a movie, the current data is fetched live from TMDB.
- A small in-memory cache (5 minutes) avoids re-fetching the same movie from TMDB on every page view, which matters once the watchlist/featured list contains several movies.
