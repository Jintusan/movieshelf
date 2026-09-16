require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");

require("./db/db"); // make sure the SQLite file + tables exist before anything else runs

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const watchlistRoutes = require("./routes/watchlist");
const reviewRoutes = require("./routes/reviews");
const featuredRoutes = require("./routes/featured");

const app = express();

app.use(express.json());

// Session-based login: after a successful login, req.session.user holds
// { id, username, role }. The cookie itself only contains a session id -
// the actual user data stays server-side.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// REST API
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/featured", featuredRoutes);

// Static frontend (plain HTML/CSS/JS, served directly - no build step).
// All pages live under public/pages/, so "/" itself needs an explicit
// redirect to the actual homepage file.
app.get("/", (req, res) => res.redirect("/pages/index.html"));
app.use(express.static(path.join(__dirname, "..", "public")));

// Basic error handler as a safety net for anything that throws
// synchronously and isn't already caught in a route.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
