import { api, el, formatDate } from "./api.js"; // Backend-Bote, Element-Baukasten, Datum
import { renderNav } from "./nav.js"; // Navigationsleiste

const user = await renderNav(); // Navigation bauen und User merken (top-level await)
if (!user || user.role !== "admin") { // niemand eingeloggt ODER kein Admin?
  window.location.href = "/pages/index.html"; // zurück zur Startseite
  throw new Error("not an admin"); // Rest der Datei nicht mehr ausführen
}

async function loadFeatured() { // zeigt die aktuell featured Filme mit "Remove"-Button
  const { featured } = await api("/api/featured"); // Liste vom Backend (öffentlich)
  const grid = document.getElementById("featured-grid"); // Container dafür
  grid.replaceChildren(
    ...(featured.length // gibt es Einträge?
      ? featured.map((movie) => // ja: pro Film eine Karte
          el("div", { class: "movie-card" }, [ // äußere Box
            el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }), // Poster oder Platzhalter
            el("div", { class: "body" }, [ // Textbereich
              el("span", {}, [movie.title]), // Titel (kein Link)
              el("div", { class: "meta" }, [formatDate(movie.releaseDate)]), // Erscheinungsdatum
              el("button", { // Remove-Button
                class: "danger", // rot
                onclick: async () => { // beim Klick
                  await api(`/api/featured/${movie.id}`, { method: "DELETE" }); // Backend: aus Featured entfernen (nur Admin)
                  loadFeatured(); // Liste neu laden
                },
              }, ["Remove"]),
            ]),
          ])
        )
      : [el("p", { class: "muted" }, ["Nothing featured yet."])]) // nein: Hinweis
  );
}

async function search(query) { // sucht Filme, die man featuren kann
  const { movies } = await api(`/api/movies/search?q=${encodeURIComponent(query)}`); // Suche über unser Backend (TMDB)
  const grid = document.getElementById("results-grid"); // Container für die Treffer
  grid.replaceChildren(
    ...(movies.length // gibt es Treffer?
      ? movies.map((movie) => // ja: pro Film eine Karte
          el("div", { class: "movie-card" }, [ // äußere Box
            el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }), // Poster oder Platzhalter
            el("div", { class: "body" }, [ // Textbereich
              el("span", {}, [movie.title]), // Titel
              el("div", { class: "meta" }, [formatDate(movie.releaseDate)]), // Erscheinungsdatum
              el("button", { // "+ Feature"-Button
                onclick: async (e) => { // beim Klick (e = Klick-Ereignis)
                  e.target.disabled = true; // Button sperren (kein Doppelklick)
                  try {
                    await api("/api/featured", { method: "POST", body: { movieId: movie.id } }); // Backend: Film featuren (nur Admin)
                    await loadFeatured(); // Featured-Liste oben aktualisieren
                  } catch (err) {
                    alert(err.message); // Fehler als Popup
                    e.target.disabled = false; // Button wieder freigeben
                  }
                },
              }, ["+ Feature"]),
            ]),
          ])
        )
      : [el("p", { class: "muted" }, ["No results."])]) // nein: Hinweis
  );
}

document.getElementById("search-form").addEventListener("submit", (e) => { // beim Absenden der Suche
  e.preventDefault(); // Seite nicht neu laden
  const query = document.getElementById("search-input").value.trim(); // Suchwort, Leerzeichen am Rand weg
  if (query) search(query); // nur suchen, wenn etwas drinsteht
});

loadFeatured(); // beim Laden: aktuelle Featured-Filme anzeigen