require("dotenv").config(); // .env einlesen

const path = require("path"); // Pfade bauen
const express = require("express"); // Webserver
const session = require("express-session"); // Login merken

require("./db/db"); // Datenbank starten

const authRoutes = require("./routes/auth"); // Login/Register
const movieRoutes = require("./routes/movies"); // TMDB-Filme
const watchlistRoutes = require("./routes/watchlist"); // Watchlist
const reviewRoutes = require("./routes/reviews"); // Reviews
const featuredRoutes = require("./routes/featured"); // Featured

const app = express(); // Server erzeugen

app.use(express.json()); // JSON -> req.body

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me", // Cookie signieren
    resave: false, // nur speichern bei Änderung
    saveUninitialized: false, // Gäste: kein Cookie
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 Stunden
    },
  })
);

app.use("/api/auth", authRoutes); // -> auth.js
app.use("/api/movies", movieRoutes); // -> movies.js
app.use("/api/watchlist", watchlistRoutes); // -> watchlist.js
app.use("/api/reviews", reviewRoutes); // -> reviews.js
app.use("/api/featured", featuredRoutes); // -> featured.js

app.get("/", (req, res) => res.redirect("/pages/index.html")); // "/" -> Startseite
app.use(express.static(path.join(__dirname, "..", "public"))); // Frontend ausliefern

app.use((err, req, res, next) => { // Fehler-Handler (4 Parameter)
  console.error(err); // Fehler loggen
  res.status(500).json({ error: "Internal server error." }); // 500 an Browser
});

const PORT = process.env.PORT || 3000; // Port aus .env
app.listen(PORT, () => { // Server starten
  console.log(`Server running at http://localhost:${PORT}`); // Meldung
});