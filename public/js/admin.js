// Admin panel: the exclusive half of Feature 4 (Featured Movies Curation).
// Anyone who isn't an admin gets sent home - the backend enforces the
// real security via requireAdmin, this is just so a non-admin doesn't
// see a broken/unusable page.

import { api, el, formatDate } from "./api.js";
import { renderNav } from "./nav.js";

const user = await renderNav();
if (!user || user.role !== "admin") {
  window.location.href = "/index.html";
  throw new Error("not an admin");
}

async function loadFeatured() {
  const { featured } = await api("/api/featured");
  const grid = document.getElementById("featured-grid");
  grid.replaceChildren(
    ...(featured.length
      ? featured.map((movie) =>
          el("div", { class: "movie-card" }, [
            el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }),
            el("div", { class: "body" }, [
              el("span", {}, [movie.title]),
              el("div", { class: "meta" }, [formatDate(movie.releaseDate)]),
              el("button", {
                class: "danger",
                onclick: async () => {
                  await api(`/api/featured/${movie.id}`, { method: "DELETE" });
                  loadFeatured();
                },
              }, ["Remove"]),
            ]),
          ])
        )
      : [el("p", { class: "muted" }, ["Nothing featured yet."])])
  );
}

async function search(query) {
  const { movies } = await api(`/api/movies/search?q=${encodeURIComponent(query)}`);
  const grid = document.getElementById("results-grid");
  grid.replaceChildren(
    ...(movies.length
      ? movies.map((movie) =>
          el("div", { class: "movie-card" }, [
            el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }),
            el("div", { class: "body" }, [
              el("span", {}, [movie.title]),
              el("div", { class: "meta" }, [formatDate(movie.releaseDate)]),
              el("button", {
                onclick: async (e) => {
                  e.target.disabled = true;
                  try {
                    await api("/api/featured", { method: "POST", body: { movieId: movie.id } });
                    await loadFeatured();
                  } catch (err) {
                    alert(err.message);
                    e.target.disabled = false;
                  }
                },
              }, ["+ Feature"]),
            ]),
          ])
        )
      : [el("p", { class: "muted" }, ["No results."])])
  );
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = document.getElementById("search-input").value.trim();
  if (query) search(query);
});

loadFeatured();
