const CACHE_NAME = "rotorcalculator-web-1790823231767";
const PRECACHE = [
  "./",
  "./.nojekyll",
  "./assets/index-BzKkaN0d.js",
  "./assets/style-RIRvG5o3.css",
  "./icon.png",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(async () => {
        if (event.request.mode === "navigate") {
          return (await caches.match("./index.html")) ?? Response.error();
        }
        return Response.error();
      });
    })
  );
});
