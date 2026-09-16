import { api } from "./api.js";
import { renderNav } from "./nav.js";

renderNav();

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  errorEl.hidden = true;

  try {
    await api("/api/auth/register", { method: "POST", body: { username, email, password } });
    window.location.href = "/pages/index.html";
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
});
