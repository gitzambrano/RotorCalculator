import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Test hooks: SW_DIST_DIR reads another build folder, SW_OUT_FILE writes sw.js elsewhere.
const distPath = process.env.SW_DIST_DIR ? join(process.env.SW_DIST_DIR, "/") : fileURLToPath(new URL("../dist/", import.meta.url));
const outFile = process.env.SW_OUT_FILE ?? join(distPath, "sw.js");
const pkg = JSON.parse(await readFile(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full));
    else files.push(full);
  }
  return files;
}

// Files that must be present in the build so offline launch and the help dialogs work.
const REQUIRED = [
  "icon.png", "icon-maskable-512.png", "manifest.webmanifest",
  "physics_help.html", "physics_help_light.html", "physics_help_midnight.html", "physics_help_sepia.html",
  "privacy_policy.html", "privacy_policy_light.html", "privacy_policy_midnight.html", "privacy_policy_sepia.html",
];

try {
  const files = (await listFiles(distPath)).sort();
  const rel = (file) => relative(distPath, file).split(sep).join("/");
  const kept = files.filter((file) => {
    const r = rel(file);
    return r !== "sw.js" && !r.endsWith(".map") && !r.endsWith(".zip") && !r.endsWith(".apk");
  });
  const assets = kept.map((file) => "./" + rel(file));
  if (!assets.includes("./index.html")) throw new Error("dist/index.html is missing");
  for (const required of REQUIRED) {
    if (!assets.includes("./" + required)) throw new Error("Required asset is missing from dist: " + required);
  }
  assets.unshift("./");

  // Cache version = package version + hash of all precached file names and contents.
  const hash = createHash("sha256");
  for (const file of kept) {
    hash.update(rel(file));
    hash.update(await readFile(file));
  }
  const cacheName = `rotorcalculator-web-${pkg.version}-${hash.digest("hex").slice(0, 10)}`;
  const sw = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify([...new Set(assets)], null, 2)};
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
`;

  await writeFile(outFile, sw, "utf8");
  console.log(`Generated ${outFile} (${cacheName}, ${assets.length} precached files)`);
} catch (err) {
  console.error("Could not generate sw.js:", err.message);
  process.exit(1);
}
