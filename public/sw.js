// Sovereign J.A.R.V.I.S. Mark-VI PWA Service Worker
// Enables offline app shell, caching, and instant startup when PC is powered off.

const CACHE_NAME = 'jarvis-sovereign-v6'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/welcome.mp3'
]

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {})
    })
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Network first for dynamic API calls
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

  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        if (res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      }).catch(() => {
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html')
        }
      })
    })
  )
})
