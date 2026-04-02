// Service Worker — ADMVC Cloud PWA
const CACHE_NAME = 'admvc-v2'

const PRECACHE = [
  '/membros/login',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'ADMVC'
  const options = {
    body: data.body || '',
    icon: '/images/icon-192x192.png',
    badge: '/images/favicon-48x48.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'admvc-notification',
    renotify: true,
    data: { url: data.url || '/membros/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Clique na notificacao → abrir a URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/membros/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se ja tem uma janela aberta, focar nela
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Senao, abrir nova janela
      return clients.openWindow(url)
    })
  )
})
