// Sovereign J.A.R.V.I.S. Mark-VI PWA Service Worker (NETWORK-FIRST STRATEGY)
// Guarantees mobile and desktop always get the latest deployed Mark-VI bundle immediately.

const CACHE_NAME = 'jarvis-mark6-quantum-v2'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      // Purge ALL legacy Mark-V and stale caches immediately
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW] Purging outdated cache:', k)
          return caches.delete(k)
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // API calls: strictly network-first
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'Primary Base-Station in Standby. Sovereign Mobile Core Active.',
            timestamp: Date.now()
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // HTML documents, JS modules, CSS: NETWORK-FIRST (Fall back to cache only if strictly offline)
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return networkResponse
      })
      .catch(() => {
        // Only return cached asset when network is truly down
        return caches.match(e.request).then((cached) => {
          if (cached) return cached
          if (e.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/') || caches.match('/index.html')
          }
        })
      })
  )
})
