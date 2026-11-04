import { api, el, formatDate } from "./api.js"; // Backend-Bote, Element-Baukasten, Datum
import { renderNav } from "./nav.js"; // Navigationsleiste

const movieId = Number(new URLSearchParams(window.location.search).get("id")); // Film-ID aus der URL (?id=550) lesen, als Zahl
const movieRoot = document.getElementById("movie-root"); // Container für die Film-Details
const reviewFormRoot = document.getElementById("review-form-root"); // Container fürs Review-Formular
const reviewsList = document.getElementById("reviews-list"); // Container für die Review-Liste

if (!Number.isInteger(movieId)) { // keine gültige Zahl in der URL?
  movieRoot.textContent = "No movie id given."; // Hinweis anzeigen
  throw new Error("missing id"); // Rest der Datei nicht mehr ausführen
}

async function renderMovie(user) { // zeigt Poster, Titel, Infos
  const { movie } = await api(`/api/movies/${movieId}`); // Film vom Backend holen (kommt von TMDB)

  const badges = el("div", { class: "badges" }, [ // kleine Info-Etiketten
    el("span", {}, [`★ ${movie.voteAverage ?? "-"} (${movie.voteCount ?? 0} votes)`]), // Bewertung + Anzahl Stimmen
    el("span", {}, [formatDate(movie.releaseDate)]), // Erscheinungsdatum
    el("span", {}, [movie.originalLanguage?.toUpperCase() || "?"]), // Sprache groß, "?" wenn unbekannt
    movie.adult ? el("span", {}, ["18+"]) : null, // "18+" nur bei Erwachsenenfilm, sonst nichts
  ].filter(Boolean)); // null-Einträge aus der Liste entfernen

  const actions = el("div", { class: "actions" }); // leere Box für die Buttons (wird später gefüllt)

  const info = el("div", { class: "info" }, [ // rechte Seite: Textbereich
    el("h2", { style: "margin-top:0" }, [movie.title]), // Titel
    badges, // die Etiketten von oben
    el("p", {}, [movie.overview || "No description available."]), // Beschreibung oder Ersatztext
    actions, // Platz für die Buttons
  ]);

  movieRoot.replaceChildren( // "Loading..." durch den echten Inhalt ersetzen
    el("div", { class: "movie-detail" }, [
      el("img", { src: movie.posterUrl || "https://placehold.co/260x390?text=No+Poster", alt: movie.title }), // Poster oder Platzhalter
      info, // Textbereich daneben
    ])
  );

  await renderActions(actions, user); // jetzt die Buttons einsetzen
}

async function renderActions(actions, user) { // baut die Buttons (Watchlist, Featured)
  if (!user) { // Gast?
    actions.replaceChildren(el("p", { class: "muted" }, ["Log in to add this movie to your watchlist or write a review."])); // nur Hinweis
    return; // fertig
  }

  // --- Watchlist button (Feature 2) ---
  const { watchlist } = await api("/api/watchlist"); // meine Watchlist holen
  const inWatchlist = watchlist.some((item) => item.movie.id === movieId); // ist dieser Film schon drin? (true/false)

  const watchlistBtn = el("button", { // der Watchlist-Button
    class: inWatchlist ? "secondary" : "", // anderes Aussehen, wenn schon drin
    onclick: async () => { // beim Klick
      watchlistBtn.disabled = true; // Button sperren (kein Doppelklick)
      try {
        if (inWatchlist) await api(`/api/watchlist/${movieId}`, { method: "DELETE" }); // drin: entfernen
        else await api("/api/watchlist", { method: "POST", body: { movieId } }); // nicht drin: hinzufügen
        await renderActions(actions, user); // Buttons neu bauen (Text wechselt)
      } catch (err) {
        alert(err.message); // Fehler als Popup
        watchlistBtn.disabled = false; // Button wieder freigeben
      }
    },
  }, [inWatchlist ? "✓ In Watchlist (remove)" : "+ Add to Watchlist"]); // Beschriftung je nach Zustand

  const buttons = [watchlistBtn]; // Liste der Buttons, Watchlist immer dabei

  // --- Featured button, admin only (Feature 4) ---
  if (user.role === "admin") { // nur Admins
    const { featured } = await api("/api/featured"); // aktuelle Featured-Filme holen
    const isFeatured = featured.some((m) => m.id === movieId); // ist dieser Film featured?
    const featuredBtn = el("button", { // der Featured-Button
      class: isFeatured ? "danger" : "secondary", // rot, wenn man ihn entfernen kann
      onclick: async () => { // beim Klick
        featuredBtn.disabled = true; // Button sperren
        try {
          if (isFeatured) await api(`/api/featured/${movieId}`, { method: "DELETE" }); // featured: entfernen
          else await api("/api/featured", { method: "POST", body: { movieId } }); // nicht featured: hinzufügen
          await renderActions(actions, user); // Buttons neu bauen
        } catch (err) {
          alert(err.message); // Fehler als Popup
          featuredBtn.disabled = false; // Button wieder freigeben
        }
      },
    }, [isFeatured ? "★ Remove from Featured" : "☆ Add to Featured (Admin)"]); // Beschriftung je nach Zustand
    buttons.push(featuredBtn); // zur Liste hinzufügen
  }

  actions.replaceChildren(...buttons); // alle Buttons in die Box setzen
}

async function renderReviewForm(user) { // baut das Review-Formular
  if (!user) { // Gast?
    reviewFormRoot.replaceChildren(); // nichts anzeigen
    return;
  }

  // Pre-fill with the user's own existing review, if any, so posting
  // again is an edit rather than starting from scratch.
  const { reviews: myReviews } = await api("/api/reviews/me"); // meine Reviews holen (umbenannt zu myReviews)
  const mine = myReviews.find((r) => r.movie.id === movieId); // meine Review zu DIESEM Film (oder undefined)

  const ratingSelect = el("select", { id: "rating-input" }, // Dropdown für die Sterne
    [1, 2, 3, 4, 5].map((n) => { // für jede Zahl 1-5 eine Option
      const opt = el("option", { value: n }, [`${n} star${n > 1 ? "s" : ""}`]); // "1 star", "2 stars", ...
      if (mine && mine.rating === n) opt.setAttribute("selected", "selected"); // meine alte Bewertung vorauswählen
      return opt;
    })
  );
  const textInput = el("textarea", { id: "review-text-input", rows: 3, placeholder: "Your review (optional)" }); // Textfeld
  textInput.value = mine?.reviewText || ""; // alten Text vorausfüllen, sonst leer

  const actionButtons = [el("button", { type: "submit" }, [mine ? "Update review" : "Submit review"])]; // Absenden-Button

  if (mine) { // gibt es schon eine Review von mir?
    actionButtons.push(
      el("button", { // zusätzlich: Löschen-Button
        type: "button", // sendet das Formular NICHT ab
        class: "danger", // rot
        onclick: async () => { // beim Klick
          if (!confirm("Delete your review for this movie?")) return; // Sicherheitsfrage, bei "Abbrechen" Schluss
          try {
            await api(`/api/reviews/${movieId}`, { method: "DELETE" }); // Review löschen
            await renderReviewForm(user); // Formular neu bauen (jetzt leer)
            await loadReviews(); // Review-Liste neu laden
          } catch (err) {
            alert(err.message); // Fehler als Popup
          }
        },
      }, ["Delete review"])
    );
  }

  const form = el("form", { class: "stacked" }, [ // das Formular zusammenbauen
    el("label", {}, ["Your rating"]), // Beschriftung
    ratingSelect, // Sterne-Dropdown
    textInput, // Textfeld
    el("div", { class: "actions" }, actionButtons), // Buttons
  ]);

  form.addEventListener("submit", async (e) => { // beim Absenden
    e.preventDefault(); // Seite nicht neu laden
    try {
      await api("/api/reviews", { // Review speichern (Backend macht Upsert: neu oder ändern)
        method: "POST",
        body: { movieId, rating: Number(ratingSelect.value), reviewText: textInput.value }, // Dropdown-Wert ist Text, daher Number()
      });
      await renderReviewForm(user); // Formular neu bauen (zeigt jetzt "Update review")
      await loadReviews(); // Liste neu laden
    } catch (err) {
      alert(err.message); // Fehler als Popup
    }
  });

  reviewFormRoot.replaceChildren(form); // Formular in die Seite setzen
}

async function loadReviews() { // lädt die öffentliche Review-Liste
  const { reviews } = await api(`/api/reviews/movie/${movieId}`); // alle Reviews zu diesem Film (öffentlich)
  reviewsList.replaceChildren(
    ...(reviews.length // gibt es Reviews?
      ? reviews.map((r) => // ja: für jede eine Box
          el("div", { class: "review" }, [
            el("div", { class: "stars" }, ["★".repeat(r.rating) + "☆".repeat(5 - r.rating)]), // z.B. 4 -> ★★★★☆
            el("p", {}, [r.reviewText || ""]), // Text (kann leer sein)
            el("div", { class: "meta" }, [`${r.username} · ${formatDate(r.createdAt)}`]), // Autor + Datum
          ])
        )
      : [el("p", { class: "muted" }, ["No reviews yet - be the first."])]) // nein: Hinweis
  );
}

const user = await renderNav(); // Navigation bauen und den User merken (top-level await)
await renderMovie(user); // Film-Details anzeigen
await renderReviewForm(user); // Review-Formular anzeigen
await loadReviews(); // Reviews anzeigen