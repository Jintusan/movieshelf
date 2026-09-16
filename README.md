# MovieApp – Web Technologies ILV, Compensational Exercise

A small web application that lets people search movies (via the TMDB API),
keep a personal watchlist, rate and review movies, and lets admins curate a
"Featured Movies" collection on the homepage. It implements the feature set,
resource model and role concept of the approved concept document for this
exercise.

## Tech stack

- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite (via `better-sqlite3`) — a single file, `data.sqlite`, created automatically on first start
- **Frontend:** plain HTML, CSS and vanilla JavaScript (ES modules), served as static files by Express, talking to the API asynchronously via `fetch()` — no build step, no frontend framework
- **Auth:** session-based login (`express-session`), passwords hashed with `bcrypt`
- **External API:** [The Movie Database (TMDB)](https://www.themoviedb.org/) — movie data (search, popular list, movie details)

## Dependencies and versions

- **Node.js 22 (LTS) or Node.js 24** — developed and tested with Node 22.14.0
- npm (comes with Node.js)
- No database server needed — SQLite is embedded, no separate installation required
- No C++ build tools required **on Node 22 or 24**

> **Please use Node 22 or 24.** The app itself runs on any Node ≥ 18, but its
> database driver (`better-sqlite3`) ships prebuilt binaries only for the
> current LTS lines (Node 22 and Node 24). On Node 18, 20 or 23, npm would fall
> back to compiling the driver from C++ source, which requires Visual Studio
> Build Tools on Windows. Check your version with `node --version`; if it is not
> 22.x or 24.x, [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or
> [nvm-windows](https://github.com/coreybutler/nvm-windows) can install Node 22
> alongside your existing version.

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

## Creating accounts (seed script)

The database file is not part of this repository, so a freshly cloned copy starts with an empty database. Registration through the web interface always creates a regular **User** account, so an **Admin** account (needed for the "Featured Movies" feature) has to be created with the seed script. Run it after `npm install` and after the server has been started at least once, so that `data.sqlite` exists.

**Demo setup — recommended, creates everything in one step:**

```bash
npm run seed
```

This creates two accounts and puts three movies into the homepage's "Featured" collection:

| Role  | Username   | Password       |
|-------|------------|----------------|
| Admin | `admin`     | `adminpass123`  |
| User  | `testuser`  | `testpass123`   |

**Or with your own credentials:**

```bash
npm run seed -- <username> <email> <password>
# example:
npm run seed -- myadmin myadmin@example.com mypassword
```

This creates a single admin account. If the username already exists, that account is promoted to admin and its password is reset to the one given. Running the script again is safe in both modes.

## Setting the project up on another computer

Everything needed is in this repository except two things that are deliberately excluded: the installed dependencies (`node_modules/`) and the local database file with its accounts (`data.sqlite`). The API key in `.env` is excluded as well, since it is personal. To get a running copy on a different machine:

```bash
git clone <repository-url>
cd webtech-movies-app
npm install                     # requires Node 22 or 24, see above
cp .env.example .env            # Windows: copy .env.example .env
# then put your own TMDB_API_KEY into .env
npm start                       # creates data.sqlite on first start
```

Then, in a second terminal, run `npm run seed` to create the demo accounts and featured movies. Note that the application needs internet access at runtime, because all movie data is fetched live from TMDB.

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
    seed.js              CLI script that creates the demo accounts / an admin account
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
  pages/                 one static HTML page per screen
  css/style.css           shared styling
  js/                      one small ES module per page, plus shared api.js / nav.js helpers
```

## Troubleshooting

**`npm install` fails with "Could not find any Visual Studio installation to use"**
You are on a Node version without prebuilt binaries for `better-sqlite3` (see the requirements above). Check with `node --version` and switch to Node 22 or 24, then delete `node_modules` and run `npm install` again.

**Movie lists stay empty / "Could not reach TMDB"**
The `TMDB_API_KEY` in `.env` is missing, misspelled, or the machine has no internet connection. Login and registration still work in this state — only movie data is unavailable.

**"Cannot find module 'dotenv'"**
Dependencies were not installed (or the install aborted). Run `npm install` in the project folder.

**`EADDRINUSE` on startup**
Port 3000 is already in use by another process. Set a different port in `.env`, e.g. `PORT=3001`.

**The admin area is not visible after logging in**
Only accounts with the `admin` role see it. Create one with `npm run seed` (demo admin) or `npm run seed -- <username> <email> <password>`; accounts created through the registration form are always regular users.

## Notes on the external API integration

- All TMDB calls happen **server-side** (`src/services/tmdb.js`) — the API key is read from the environment and never sent to the browser.
- Movie data is **never duplicated** in the local database. The database only stores TMDB movie ids together with user-specific data (which user has it on their watchlist, which user rated it and with what score, which admin featured it). Whenever a page needs to display a movie, the current data is fetched live from TMDB.
- A small in-memory cache (5 minutes) avoids re-fetching the same movie from TMDB on every page view, which matters once the watchlist/featured list contains several movies.
