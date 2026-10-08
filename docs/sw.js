const CACHE_NAME = "rotorcalculator-web-1.32.0-445e8278b8";
const PRECACHE = [
  "./",
  "./.nojekyll",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./apple-touch-icon.png",
  "./assets/index-B6srjFao.js",
  "./assets/style-6i0M5rt1.css",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./favicon.ico",
  "./icon-maskable-512.png",
  "./icon.png",
  "./icon_header.png",
  "./index.html",
  "./licenses/Roboto-APACHE-2.0.txt",
  "./licenses/Roboto-NOTICE.txt",
  "./manifest.webmanifest",
  "./physics_help.html",
  "./physics_help_light.html",
  "./physics_help_midnight.html",
  "./physics_help_sepia.html",
  "./privacy_policy.html",
  "./privacy_policy_light.html",
  "./privacy_policy_midnight.html",
  "./privacy_policy_sepia.html",
  "./release-1.32.json"
];
const APP_SHELL = "./index.html";

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

function isAppEntry(url) {
  const base = new URL("./", self.location.href).pathname;
  return url.pathname === base || url.pathname === base + "index.html";
}

function isHtml(request, url) {
  return request.mode === "navigate" || request.destination === "document" || request.destination === "iframe" || url.pathname.endsWith(".html");
}

// Network-first for HTML. Each page is cached under its own URL.
// Only the app entry URL (./ or ./index.html) refreshes the app shell key.
async function networkFirstHtml(event, url) {
  const entry = isAppEntry(url) && event.request.destination !== "iframe";
  try {
    const response = await fetch(event.request);
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      if (entry) await cache.put(APP_SHELL, response.clone());
      else await cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = entry
      ? await caches.match(APP_SHELL)
      : await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    // Offline navigation to a page that is not cached: show the app shell only for top-level app navigation.
    if (event.request.mode === "navigate" && event.request.destination !== "iframe") {
      return (await caches.match(APP_SHELL)) ?? Response.error();
    }
    return Response.error();
  }
}

// Cache-first for hashed assets and other static files.
async function cacheFirst(event) {
  const cached = await caches.match(event.request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (response && response.status === 200 && response.type === "basic") {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;

  if (isHtml(event.request, url)) {
    event.respondWith(networkFirstHtml(event, url));
    return;
  }
  event.respondWith(cacheFirst(event));
});
