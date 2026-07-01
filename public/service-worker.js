// public/service-worker.js

const CACHE_NAME = 'jrhof-static-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/favicon.ico',
          '/favicon/android-chrome-192x192.png',
          '/favicon/android-chrome-512x512.png',
          '/favicon/site.webmanifest',
        ]);
      })
    );
  });
  
  self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });
  
  // Handle push notifications
  self.addEventListener('push', function(event) {
    const options = {
      body: event.data?.text() || 'Joe Rossi Umpires Hall of Fame update',
      icon: '/favicon/android-chrome-192x192.png',
      badge: '/favicon/android-chrome-192x192.png',
    };
    event.waitUntil(
      self.registration.showNotification('New Notification', options)
    );
  });
