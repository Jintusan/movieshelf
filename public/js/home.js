// Homepage: Feature 1 (search & popular movies, Guest) + the public
// display of Feature 4's result (Featured Movies collection).

import { api, el, formatDate } from "./api.js";
import { renderNav } from "./nav.js";

function movieCard(movie) {
  return el("div", { class: "movie-card" }, [
    el("a", { href: `/pages/movie.html?id=${movie.id}` }, [
      el("img", {
        src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster",
        alt: movie.title,
        loading: "lazy",
      }),
    ]),
    el("div", { class: "body" }, [
      el("a", { href: `/pages/movie.html?id=${movie.id}` }, [movie.title]),
      el("div", { class: "meta" }, [`${formatDate(movie.releaseDate)} · ★ ${movie.voteAverage ?? "-"}`]),
    ]),
  ]);
}

async function loadFeatured() {
  try {
    const { featured } = await api("/api/featured");
    if (featured.length === 0) return;
    document.getElementById("featured-section").hidden = false;
    document.getElementById("featured-grid").replaceChildren(...featured.map(movieCard));
  } catch (err) {
    // A missing/invalid TMDB key shouldn't break the whole homepage.
    console.warn("Could not load featured movies:", err.message);
  }
}

async function loadPopular() {
  document.getElementById("results-label").textContent = "Popular right now";
  try {
    const { movies } = await api("/api/movies/popular");
    document.getElementById("results-grid").replaceChildren(...movies.map(movieCard));
  } catch (err) {
    document.getElementById("results-grid").replaceChildren(
      el("p", { class: "error" }, [err.message])
    );
  }
}

async function search(query) {
  document.getElementById("results-label").textContent = `Results for "${query}"`;
  try {
    const { movies } = await api(`/api/movies/search?q=${encodeURIComponent(query)}`);
    document.getElementById("results-grid").replaceChildren(
      ...(movies.length ? movies.map(movieCard) : [el("p", { class: "muted" }, ["No movies found."])])
    );
  } catch (err) {
    document.getElementById("results-grid").replaceChildren(
      el("p", { class: "error" }, [err.message])
    );
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = document.getElementById("search-input").value.trim();
  if (query) search(query);
  else loadPopular();
});

renderNav();
loadFeatured();
loadPopular();
