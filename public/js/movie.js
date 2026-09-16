// Movie detail page: combines Feature 1 (movie data), Feature 2
// (watchlist button), Feature 3 (review form + public review list) and
// the admin-only half of Feature 4 (feature/unfeature button).

import { api, el, formatDate } from "./api.js";
import { renderNav } from "./nav.js";

const movieId = Number(new URLSearchParams(window.location.search).get("id"));
const movieRoot = document.getElementById("movie-root");
const reviewFormRoot = document.getElementById("review-form-root");
const reviewsList = document.getElementById("reviews-list");

if (!Number.isInteger(movieId)) {
  movieRoot.textContent = "No movie id given.";
  throw new Error("missing id");
}

async function renderMovie(user) {
  const { movie } = await api(`/api/movies/${movieId}`);

  const badges = el("div", { class: "badges" }, [
    el("span", {}, [`★ ${movie.voteAverage ?? "-"} (${movie.voteCount ?? 0} votes)`]),
    el("span", {}, [formatDate(movie.releaseDate)]),
    el("span", {}, [movie.originalLanguage?.toUpperCase() || "?"]),
    movie.adult ? el("span", {}, ["18+"]) : null,
  ].filter(Boolean));

  const actions = el("div", { class: "actions" });

  const info = el("div", { class: "info" }, [
    el("h2", { style: "margin-top:0" }, [movie.title]),
    badges,
    el("p", {}, [movie.overview || "No description available."]),
    actions,
  ]);

  movieRoot.replaceChildren(
    el("div", { class: "movie-detail" }, [
      el("img", { src: movie.posterUrl || "https://placehold.co/260x390?text=No+Poster", alt: movie.title }),
      info,
    ])
  );

  await renderActions(actions, user);
}

async function renderActions(actions, user) {
  if (!user) {
    actions.replaceChildren(el("p", { class: "muted" }, ["Log in to add this movie to your watchlist or write a review."]));
    return;
  }

  // --- Watchlist button (Feature 2) ---
  const { watchlist } = await api("/api/watchlist");
  const inWatchlist = watchlist.some((item) => item.movie.id === movieId);

  const watchlistBtn = el("button", {
    class: inWatchlist ? "secondary" : "",
    onclick: async () => {
      watchlistBtn.disabled = true;
      try {
        if (inWatchlist) await api(`/api/watchlist/${movieId}`, { method: "DELETE" });
        else await api("/api/watchlist", { method: "POST", body: { movieId } });
        await renderActions(actions, user);
      } catch (err) {
        alert(err.message);
        watchlistBtn.disabled = false;
      }
    },
  }, [inWatchlist ? "✓ In Watchlist (remove)" : "+ Add to Watchlist"]);

  const buttons = [watchlistBtn];

  // --- Featured button, admin only (Feature 4) ---
  if (user.role === "admin") {
    const { featured } = await api("/api/featured");
    const isFeatured = featured.some((m) => m.id === movieId);
    const featuredBtn = el("button", {
      class: isFeatured ? "danger" : "secondary",
      onclick: async () => {
        featuredBtn.disabled = true;
        try {
          if (isFeatured) await api(`/api/featured/${movieId}`, { method: "DELETE" });
          else await api("/api/featured", { method: "POST", body: { movieId } });
          await renderActions(actions, user);
        } catch (err) {
          alert(err.message);
          featuredBtn.disabled = false;
        }
      },
    }, [isFeatured ? "★ Remove from Featured" : "☆ Add to Featured (Admin)"]);
    buttons.push(featuredBtn);
  }

  actions.replaceChildren(...buttons);
}

async function renderReviewForm(user) {
  if (!user) {
    reviewFormRoot.replaceChildren();
    return;
  }

  // Pre-fill with the user's own existing review, if any, so posting
  // again is an edit rather than starting from scratch.
  const { reviews: myReviews } = await api("/api/reviews/me");
  const mine = myReviews.find((r) => r.movie.id === movieId);

  const ratingSelect = el("select", { id: "rating-input" },
    [1, 2, 3, 4, 5].map((n) => {
      const opt = el("option", { value: n }, [`${n} star${n > 1 ? "s" : ""}`]);
      if (mine && mine.rating === n) opt.setAttribute("selected", "selected");
      return opt;
    })
  );
  const textInput = el("textarea", { id: "review-text-input", rows: 3, placeholder: "Your review (optional)" });
  textInput.value = mine?.reviewText || "";

  const form = el("form", { class: "stacked" }, [
    el("label", {}, ["Your rating"]),
    ratingSelect,
    textInput,
    el("div", { class: "actions" }, [
      el("button", { type: "submit" }, [mine ? "Update review" : "Submit review"]),
    ]),
  ]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/reviews", {
        method: "POST",
        body: { movieId, rating: Number(ratingSelect.value), reviewText: textInput.value },
      });
      await loadReviews();
    } catch (err) {
      alert(err.message);
    }
  });

  reviewFormRoot.replaceChildren(form);
}

async function loadReviews() {
  const { reviews } = await api(`/api/reviews/movie/${movieId}`);
  reviewsList.replaceChildren(
    ...(reviews.length
      ? reviews.map((r) =>
          el("div", { class: "review" }, [
            el("div", { class: "stars" }, ["★".repeat(r.rating) + "☆".repeat(5 - r.rating)]),
            el("p", {}, [r.reviewText || ""]),
            el("div", { class: "meta" }, [`${r.username} · ${formatDate(r.createdAt)}`]),
          ])
        )
      : [el("p", { class: "muted" }, ["No reviews yet - be the first."])])
  );
}

const user = await renderNav();
await renderMovie(user);
await renderReviewForm(user);
await loadReviews();
