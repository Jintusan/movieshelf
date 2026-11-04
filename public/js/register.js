import { api } from "./api.js"; // Boten zum Backend
import { renderNav } from "./nav.js"; // Navigationsleiste

renderNav(); // beim Laden: Navigationsleiste bauen

document.getElementById("register-form").addEventListener("submit", async (e) => { // beim Absenden des Registrierungs-Formulars
  e.preventDefault(); // Seite nicht neu laden
  const username = document.getElementById("username").value.trim(); // Benutzername, Leerzeichen am Rand weg
  const email = document.getElementById("email").value.trim(); // E-Mail, Leerzeichen am Rand weg
  const password = document.getElementById("password").value; // Passwort
  const errorEl = document.getElementById("error"); // das rote Fehler-Feld
  errorEl.hidden = true; // alten Fehler erstmal verstecken

  try { // Registrieren versuchen
    await api("/api/auth/register", { method: "POST", body: { username, email, password } }); // Daten ans Backend schicken
    window.location.href = "/pages/index.html"; // Erfolg: zur Startseite (Backend hat dich schon eingeloggt)
  } catch (err) { // Backend hat einen Fehler gemeldet (z.B. 409 Name vergeben)
    errorEl.textContent = err.message; // Meldung vom Backend eintragen
    errorEl.hidden = false; // Fehler-Feld anzeigen
  }
});