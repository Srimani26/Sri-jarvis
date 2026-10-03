// J.A.R.V.I.S. Mark-IV Service Worker
const CACHE_NAME = 'jarvis-v4-cache'
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', (event) => {
  // Let network handle dynamic API requests
  if (event.request.url.includes('/api/')) return
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  )
})
