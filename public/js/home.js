import { api, el, formatDate } from "./api.js"; // Werkzeuge: Backend-Aufruf, Element-Baukasten, Datum
import { renderNav } from "./nav.js"; // Navigationsleiste

function movieCard(movie) { // baut EINE Film-Karte aus einem Film-Objekt
  return el("div", { class: "movie-card" }, [ // äußere Box der Karte
    el("a", { href: `/pages/movie.html?id=${movie.id}` }, [ // Link zur Detailseite, Film-ID steht in der URL
      el("img", { // Poster-Bild
        src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", // kein Poster? Platzhalter-Bild
        alt: movie.title, // Ersatztext (Barrierefreiheit)
        loading: "lazy", // Bild erst laden, wenn man hinscrollt
      }),
    ]),
    el("div", { class: "body" }, [ // Textbereich unter dem Bild
      el("a", { href: `/pages/movie.html?id=${movie.id}` }, [movie.title]), // Titel als Link
      el("div", { class: "meta" }, [`${formatDate(movie.releaseDate)} · ★ ${movie.voteAverage ?? "-"}`]), // Datum + Bewertung, "-" wenn keine
    ]),
  ]);
}

async function loadFeatured() { // lädt die vom Admin ausgewählten Filme
  try { // Fehler abfangen
    const { featured } = await api("/api/featured"); // öffentlich, kein Login nötig
    if (featured.length === 0) return; // nichts featured: Bereich bleibt versteckt
    document.getElementById("featured-section").hidden = false; // Bereich sichtbar machen
    document.getElementById("featured-grid").replaceChildren(...featured.map(movieCard)); // jeden Film zur Karte machen und einsetzen
  } catch (err) { // etwas schiefgelaufen
    // A missing/invalid TMDB key shouldn't break the whole homepage.
    console.warn("Could not load featured movies:", err.message); // nur Warnung in der Konsole, Seite läuft weiter
  }
}

async function loadPopular() { // lädt die beliebten Filme
  document.getElementById("results-label").textContent = "Popular right now"; // Überschrift setzen
  try {
    const { movies } = await api("/api/movies/popular"); // Backend holt sie von TMDB
    document.getElementById("results-grid").replaceChildren(...movies.map(movieCard)); // Karten einsetzen
  } catch (err) {
    document.getElementById("results-grid").replaceChildren( // Fehlermeldung statt Karten
      el("p", { class: "error" }, [err.message])
    );
  }
}

async function search(query) { // sucht Filme nach Titel
  document.getElementById("results-label").textContent = `Results for "${query}"`; // Überschrift mit Suchwort
  try {
    const { movies } = await api(`/api/movies/search?q=${encodeURIComponent(query)}`); // Suchwort URL-sicher machen (Leerzeichen, Sonderzeichen)
    document.getElementById("results-grid").replaceChildren(
      ...(movies.length ? movies.map(movieCard) : [el("p", { class: "muted" }, ["No movies found."])]) // Treffer als Karten, sonst Hinweistext
    );
  } catch (err) {
    document.getElementById("results-grid").replaceChildren(
      el("p", { class: "error" }, [err.message])
    );
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => { // beim Absenden des Suchformulars
  e.preventDefault(); // verhindert das Neuladen der Seite
  const query = document.getElementById("search-input").value.trim(); // Text im Feld, Leerzeichen am Rand weg
  if (query) search(query); // Text vorhanden: suchen
  else loadPopular(); // leer: wieder die beliebten Filme
});

renderNav(); // beim Laden: Navigationsleiste bauen
loadFeatured(); // beim Laden: Featured-Filme holen
loadPopular(); // beim Laden: beliebte Filme holen