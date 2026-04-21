const CACHE_NAME = 'jee-tracker-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Cache install error:', err))
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                
                return response;
            })
            .catch(err => {
                return caches.match(event.request)
                    .then(response => {
                        return response || new Response('Offline - File not cached');
                    });
            })
    );
});

// Background sync for notifications
self.addEventListener('sync', event => {
    if (event.tag === 'sync-alarms') {
        event.waitUntil(
            self.registration.showNotification('JEE Tracker Check', {
                body: 'Your schedule is ready!',
                icon: '🎓'
            })
        );
    }
});

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Time to study!',
        icon: '🎓',
        badge: '📚',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification('JEE Tracker', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({type: 'window'}).then(clientList => {
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
