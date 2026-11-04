export async function api(path, options = {}) { // EIN Weg, das Backend aufzurufen (export = andere Dateien dürfen es importieren)
  const response = await fetch(path, { // Anfrage an unser Backend schicken und warten
    headers: { "Content-Type": "application/json" }, // wir senden JSON
    ...options, // method und body von außen dazunehmen (Spread)
    body: options.body ? JSON.stringify(options.body) : undefined, // Objekt -> JSON-Text, sonst kein Body
  });

  const data = await response.json().catch(() => ({})); // Antwort als Objekt lesen; klappt das nicht: leeres Objekt
  if (!response.ok) { // Status nicht 200-299?
    throw new Error(data.error || `Request failed (${response.status})`); // Fehler mit der Meldung vom Backend werfen
  }
  return data; // Daten zurückgeben
}

export function el(tag, props = {}, children = []) { // baut ein HTML-Element per Code
  const node = document.createElement(tag); // Element erzeugen, z.B. "div"
  Object.entries(props).forEach(([key, value]) => { // jede Eigenschaft durchgehen
    if (key === "class") node.className = value; // "class" -> CSS-Klasse setzen
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value); // "onclick" -> Klick-Funktion anhängen
    else node.setAttribute(key, value); // alles andere als Attribut (href, src, ...)
  });
  children.forEach((child) => node.append(child)); // Kinder (Text oder Elemente) einfügen
  return node; // fertiges Element zurückgeben
}

export function formatDate(iso) { // Datum lesbar anzeigen
  if (!iso) return "unknown"; // kein Datum?
  return new Date(iso).toLocaleDateString(); // Text -> echtes Date-Objekt -> lokales Datumsformat
}