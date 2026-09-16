// Tiny fetch() wrapper shared by every page.
// Because the frontend is served by the same Express app as the API
// (same origin), the session cookie is sent automatically - no extra
// CORS or credentials setup needed.

export async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

export function formatDate(iso) {
  if (!iso) return "unknown";
  // TMDB sends dates as plain "YYYY-MM-DD" strings; turning them into a
  // real Date object here is what lets us format/sort them properly
  // instead of just displaying the raw string.
  return new Date(iso).toLocaleDateString();
}
