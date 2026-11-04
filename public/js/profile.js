import { api, el, formatDate } from "./api.js"; // Backend-Bote, Element-Baukasten, Datum
import { renderNav } from "./nav.js"; // Navigationsleiste

const user = await renderNav(); // Navigation bauen und User merken (top-level await)
if (!user) { // niemand eingeloggt?
  window.location.href = "/pages/login.html"; // zur Login-Seite schicken
  throw new Error("not logged in"); // Rest der Datei nicht mehr ausführen
}

function movieCard(movie) { // baut EINE Film-Karte (ähnlich wie auf der Startseite, aber ohne Bewertung)
  return el("div", { class: "movie-card" }, [ // äußere Box
    el("a", { href: `/pages/movie.html?id=${movie.id}` }, [ // Link zur Detailseite
      el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }), // Poster oder Platzhalter
    ]),
    el("div", { class: "body" }, [ // Textbereich
      el("a", { href: `/pages/movie.html?id=${movie.id}` }, [movie.title]), // Titel als Link
      el("div", { class: "meta" }, [formatDate(movie.releaseDate)]), // Erscheinungsdatum
    ]),
  ]);
}

async function loadWatchlist() { // zeigt meine Watchlist
  const { watchlist } = await api("/api/watchlist"); // meine Watchlist vom Backend (nur mit Login)
  const grid = document.getElementById("watchlist-grid"); // Container dafür
  grid.replaceChildren(
    ...(watchlist.length // gibt es Einträge?
      ? watchlist.map((item) => movieCard(item.movie)) // ja: pro Eintrag eine Karte (der Film steckt in item.movie)
      : [el("p", { class: "muted" }, ["Your watchlist is empty - go add a movie!"])]) // nein: Hinweis
  );
}

async function loadReviews() { // zeigt meine eigenen Reviews
  const { reviews } = await api("/api/reviews/me"); // meine Reviews vom Backend (nur mit Login)
  const list = document.getElementById("reviews-list"); // Container dafür
  list.replaceChildren(
    ...(reviews.length // gibt es Reviews?
      ? reviews.map((r) => // ja: pro Review eine Box
          el("div", { class: "review" }, [
            el("a", { href: `/pages/movie.html?id=${r.movie.id}` }, [r.movie.title]), // Filmtitel als Link
            el("div", { class: "stars" }, ["★".repeat(r.rating) + "☆".repeat(5 - r.rating)]), // z.B. 4 -> ★★★★☆
            el("p", {}, [r.reviewText || ""]), // Text (kann leer sein)
          ])
        )
      : [el("p", { class: "muted" }, ["You haven't reviewed any movies yet."])]) // nein: Hinweis
  );
}

loadWatchlist(); // beim Laden: Watchlist anzeigen
loadReviews(); // beim Laden: Reviews anzeigen