// HerLife offline shell: only cache static application assets, never API responses,
// journal entries, credentials, Supabase Auth responses or user-specific data.
const CACHE_NAME = 'herlife-static-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('herlife-static-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Navigation requires live authentication and database connectivity.
  // Avoid serving an out-of-date authenticated shell offline.
  if (request.mode === 'navigate') return;
  if (!url.pathname.startsWith('/assets/') && !['/icon.svg', '/icon-maskable.svg', '/favicon.svg', '/manifest.webmanifest'].includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
