import { api } from "./api.js"; // Boten zum Backend
import { renderNav } from "./nav.js"; // Navigationsleiste

renderNav(); // beim Laden: Navigationsleiste bauen

document.getElementById("login-form").addEventListener("submit", async (e) => { // beim Absenden des Login-Formulars
  e.preventDefault(); // Seite nicht neu laden
  const username = document.getElementById("username").value.trim(); // Benutzername, Leerzeichen am Rand weg
  const password = document.getElementById("password").value; // Passwort (kein trim, Leerzeichen könnten Absicht sein)
  const errorEl = document.getElementById("error"); // das rote Fehler-Feld
  errorEl.hidden = true; // alten Fehler erstmal verstecken

  try { // Login versuchen
    await api("/api/auth/login", { method: "POST", body: { username, password } }); // Daten ans Backend schicken
    window.location.href = "/pages/index.html"; // Erfolg: zur Startseite
  } catch (err) { // Backend hat einen Fehler gemeldet (z.B. 401)
    errorEl.textContent = err.message; // Meldung vom Backend eintragen
    errorEl.hidden = false; // Fehler-Feld anzeigen
  }
});