const CACHE_NAME = 'vibe-expense-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch event — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  const title = data.title || 'Vibe Expense'
  const options = {
    body: data.body || 'Bạn có thông báo mới',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/dashboard',
    },
    vibrate: [100, 50, 100],
  }
  
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
