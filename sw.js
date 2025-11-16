// sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Just claim clients; no cache logic needed for now
  event.waitUntil(self.clients.claim());
});

// Optional: simple offline fallback for /pwa.html
self.addEventListener('fetch', (event) => {
  return;
});
