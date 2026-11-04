import { api, el } from "./api.js"; // Werkzeuge aus api.js holen

export async function renderNav() { // baut die Navigationsleiste (export = andere Seiten dürfen sie aufrufen)
  const nav = document.getElementById("nav"); // das leere <nav> der Seite holen
  if (!nav) return; // gibt es keins: abbrechen

  const { user } = await api("/api/auth/me"); // Backend fragen: wer ist eingeloggt? (user oder null)

  const links = [ // Liste aller Links, Home gibt es immer
    el("a", { href: "/pages/index.html" }, ["Home"]), // Link "Home"
  ];

  if (user) { // eingeloggt?
    links.push(el("a", { href: "/pages/profile.html" }, ["My Profile"])); // Profil-Link anhängen
    if (user.role === "admin") { // nur für Admins
      links.push(el("a", { href: "/pages/admin.html" }, ["Admin"])); // Admin-Link anhängen
    }
    links.push(el("span", { class: "nav-user" }, [`Hi, ${user.username} (${user.role})`])); // Begrüßung mit Name und Rolle
    links.push(
      el("button", { // Logout-Button
        class: "link-button", // sieht aus wie ein Link
        onclick: async () => { // läuft erst beim Klick
          await api("/api/auth/logout", { method: "POST" }); // Session im Backend beenden
          window.location.href = "/pages/index.html"; // zur Startseite wechseln
        },
      }, ["Logout"]) // Beschriftung
    );
  } else { // nicht eingeloggt
    links.push(el("a", { href: "/pages/login.html" }, ["Login"])); // Login-Link
    links.push(el("a", { href: "/pages/register.html" }, ["Register"])); // Register-Link
  }

  nav.replaceChildren(...links); // Leiste leeren und alle Links einsetzen
  return user; // User zurückgeben (andere Seiten nutzen ihn)
}