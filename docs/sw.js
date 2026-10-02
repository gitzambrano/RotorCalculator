const CACHE_NAME = "rotorcalculator-web-1790959804555";
const PRECACHE = [
  "./",
  "./.nojekyll",
  "./assets/index-COppCDhs.js",
  "./assets/style-TG5iDxBx.css",
  "./icon.png",
  "./icon_header.png",
  "./index.html",
  "./licenses/Roboto-APACHE-2.0.txt",
  "./licenses/Roboto-NOTICE.txt",
  "./manifest.webmanifest",
  "./physics_help.html",
  "./physics_help_light.html",
  "./physics_help_midnight.html",
  "./privacy_policy.html",
  "./privacy_policy_light.html",
  "./release-1.23.json"
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
