// public/service-worker.js

self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('my-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/favicon.ico',
          '/android-chrome-192x192.png',
          '/android-chrome-512x512.png',
          '/manifest.json',
          // Add other assets you want to cache
        ]);
      })
    );
  });
  
  self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['my-cache'];
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
      body: event.data.text(),
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
    };
    event.waitUntil(
      self.registration.showNotification('New Notification', options)
    );
  });