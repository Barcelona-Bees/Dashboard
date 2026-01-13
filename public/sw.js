self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('beehive-v1').then(cache => cache.addAll([
    '/', '/index.html', '/manifest.webmanifest',
    '/mock/readings.json', '/mock/alerts.json', '/mock/sensors.json'
  ])))
})
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)))
})
