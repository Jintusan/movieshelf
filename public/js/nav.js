// Renders the navigation bar and adapts it to whoever is logged in
// (or not). Every page includes <nav id="nav"></nav> plus this script.

import { api, el } from "./api.js";

export async function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const { user } = await api("/api/auth/me");

  const links = [
    el("a", { href: "/pages/index.html" }, ["Home"]),
  ];

  if (user) {
    links.push(el("a", { href: "/pages/profile.html" }, ["My Profile"]));
    if (user.role === "admin") {
      links.push(el("a", { href: "/pages/admin.html" }, ["Admin"]));
    }
    links.push(el("span", { class: "nav-user" }, [`Hi, ${user.username} (${user.role})`]));
    links.push(
      el("button", {
        class: "link-button",
        onclick: async () => {
          await api("/api/auth/logout", { method: "POST" });
          window.location.href = "/pages/index.html";
        },
      }, ["Logout"])
    );
  } else {
    links.push(el("a", { href: "/pages/login.html" }, ["Login"]));
    links.push(el("a", { href: "/pages/register.html" }, ["Register"]));
  }

  nav.replaceChildren(...links);
  return user;
}
