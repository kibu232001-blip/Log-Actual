// LOG ACTUAL Service Worker v1
const CACHE = 'logactual-v1'
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/audio/game-bgm.mp3',
  '/sprites/convoy-sprites.png',
  '/sprites/attack-sprites.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Only cache http/https — skip chrome-extension, data URIs, etc.
  if (!e.request.url.startsWith('http')) return

  const url = new URL(e.request.url)
  
  if (url.hostname.includes('elevenlabs') || 
      url.hostname.includes('osrm') || 
      url.hostname.includes('openstreetmap')) {
    // Always network for external APIs
    return
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
      
      return cached || network
    })
  )
})
