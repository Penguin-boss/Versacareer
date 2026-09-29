const CACHE_NAME = 'versacareer-v1';
const STATIC_CACHE = 'versacareer-static-v1';
const DYNAMIC_CACHE = 'versacareer-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/pricing',
  '/privacy',
  '/blog',
  '/auth',
  '/assets/brand/icon-512.webp',
  '/assets/brand/icon-192.webp',
  '/assets/brand/apple-touch-icon.webp',
  '/assets/brand/og-card.webp',
  '/assets/brand/VersaCareer_Logo_Dark.webp',
  '/manifest.webmanifest',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first - for static assets
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Return offline page or placeholder
      if (request.destination === 'document') {
        return caches.match('/');
      }
      throw error;
    }
  },
  
  // Network first - for API calls and dynamic content
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;
      throw error;
    }
  },
  
  // Stale while revalidate - for fonts and images
  staleWhileRevalidate: async (request) => {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - apply cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) return;
  
  // Never cache authenticated API responses. A shared browser cache must not
  // become a cross-session store for resumes, profiles, or billing data.
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    return;
  }
  
  // Handle different resource types
  if (request.destination === 'document' || request.destination === '') {
    // HTML pages - network first for freshness
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
  } else if (request.destination === 'style' || request.destination === 'script') {
    // CSS/JS - stale while revalidate
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
  } else if (request.destination === 'image' || request.destination === 'font') {
    // Images and fonts - cache first
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
  } else {
    // Default - network first
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'resume-upload') {
    event.waitUntil(syncResumeUploads());
  }
});

async function syncResumeUploads() {
  // Implement offline queue for resume uploads
  console.log('Syncing offline resume uploads...');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/brand/icon-192.webp',
    badge: '/assets/brand/icon-192.webp',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});
