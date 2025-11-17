// sw.js for UkrBirds PWA on radiancegamesstudio.github.io

const CACHE_VERSION = "ukrbirds-pwa-v2"; // bump version after changes
const CACHE_PREFIX = "UkrBirds-shell-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

// Your offline page
// If you later rename to index.offline.html, change this to "/index.offline.html"
const OFFLINE_URL = "/index.offline";

// Files we want cached up-front
const PRECACHE_URLS = [
  "/",                    // root -> index.html
  "/index.html",
  "/pwa.html",
  "/ukrbirds.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/index.offline"        // 👈 your offline file
];

// ACTIVATION: clean old caches + enable navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      if ("navigationPreload" in self.registration) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (e) {
          console.warn("Navigation preload enable failed:", e);
        }
      }

      await self.clients.claim();
    })()
  );
});

// INSTALL: pre-cache app shell + offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

// NAVIGATION handler: network → cache → OFFLINE_URL
async function handleNavigationRequest(event) {
  const cache = await caches.open(CACHE_NAME);

  // 1) Try navigation preload if available
  let response = await event.preloadResponse;
  if (!response) {
    try {
      response = await fetch(event.request);
    } catch (e) {
      // Network failed -> fallback to cached page or offline page
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;

      return new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }

  // If fetch worked, update cache for this URL
  cache.put(event.request, response.clone());
  return response;
}

// Generic cache-first helper
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignore cross-origin (itch.io, fonts, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigations => special handler
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // Precached static assets => cache-first
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Other same-origin GETs => cache-first as a safe default
  event.respondWith(cacheFirst(request));
});
