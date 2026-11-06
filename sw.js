// Service worker: makes the app available offline.
// Change VERSION at every release, so phones download the new files.
const VERSION = "bc-0.1.0";

const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "engine/engine.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "rules/questions.json",
  "rules/models.json",
  "rules/warnings.json",
  "rules/presentation.json",
  "rules/guidelines.json",
  "rules/sources.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Delete the caches of earlier versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first (rules always up to date), cache when offline
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache: the browser checks the file with the server (a 304 response if unchanged)
    fetch(e.request, { cache: "no-cache" })
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
