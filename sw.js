const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/pwa.html",
  "/ukrbirds.webmanifest",
  "/favicon.ico",
  // Only keep files you are 100% sure exist:
   "/icons/icon-192.png",
   "/icons/icon-512.png",
   "/index.offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Add each URL individually, but ignore failures
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            } else {
              console.warn("[SW] Failed to precache:", url, response && response.status);
            }
          } catch (e) {
            console.warn("[SW] Error precaching:", url, e);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});
