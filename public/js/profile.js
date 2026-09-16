// Profile page: shows the logged-in user's own Feature 2 (watchlist) and
// Feature 3 (reviews) data. Requires login - a guest gets bounced to
// /login.html, since requireAuth on the backend would just 401 anyway.

import { api, el, formatDate } from "./api.js";
import { renderNav } from "./nav.js";

const user = await renderNav();
if (!user) {
  window.location.href = "/pages/login.html";
  throw new Error("not logged in");
}

function movieCard(movie) {
  return el("div", { class: "movie-card" }, [
    el("a", { href: `/pages/movie.html?id=${movie.id}` }, [
      el("img", { src: movie.posterUrl || "https://placehold.co/200x300?text=No+Poster", alt: movie.title }),
    ]),
    el("div", { class: "body" }, [
      el("a", { href: `/pages/movie.html?id=${movie.id}` }, [movie.title]),
      el("div", { class: "meta" }, [formatDate(movie.releaseDate)]),
    ]),
  ]);
}

async function loadWatchlist() {
  const { watchlist } = await api("/api/watchlist");
  const grid = document.getElementById("watchlist-grid");
  grid.replaceChildren(
    ...(watchlist.length
      ? watchlist.map((item) => movieCard(item.movie))
      : [el("p", { class: "muted" }, ["Your watchlist is empty - go add a movie!"])])
  );
}

async function loadReviews() {
  const { reviews } = await api("/api/reviews/me");
  const list = document.getElementById("reviews-list");
  list.replaceChildren(
    ...(reviews.length
      ? reviews.map((r) =>
          el("div", { class: "review" }, [
            el("a", { href: `/pages/movie.html?id=${r.movie.id}` }, [r.movie.title]),
            el("div", { class: "stars" }, ["★".repeat(r.rating) + "☆".repeat(5 - r.rating)]),
            el("p", {}, [r.reviewText || ""]),
          ])
        )
      : [el("p", { class: "muted" }, ["You haven't reviewed any movies yet."])])
  );
}

loadWatchlist();
loadReviews();
