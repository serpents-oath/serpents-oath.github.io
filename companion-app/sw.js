// The app shell is kept for fast starts and works offline up to the sign-in; every server call goes to the network.
const V = 'companion-3';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;                // the server and the fonts: the network
  // network first (a new version shows at once), the cache when offline
  e.respondWith((async () => { const c = await caches.open(V);
    try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch { const hit = await c.match(e.request); if (hit) return hit; throw new Error('offline'); } })());
});
