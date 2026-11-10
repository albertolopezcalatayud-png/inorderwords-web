// InOrderWords service worker v2.
// Network first for everything: changes to the site (games, units, audio) reach every visitor straight away.
// The cache is only a fallback for when there is no connection.
const CACHE = 'inorderwords-v2';
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

// Drops inorderwords-v1, which served old copies of scripts and audio.
const dropOldCaches = () => caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))));

self.addEventListener('activate', e => {
  e.waitUntil(dropOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') e.waitUntil(dropOldCaches());
  e.respondWith(
    fetch(req).then(res => {
      // Keep a copy for offline use (whole files only: audio players ask for byte ranges).
      if (res.status === 200 && !req.headers.has('range')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(req).then(hit => hit || (req.mode === 'navigate' ? c.match('/') : Response.error()))))
  );
});
