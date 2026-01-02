// حكاياتي الذكية - Service Worker
// Cache version - update this to bust the cache
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `hikayati-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fallback to cache (for API calls and dynamic content)
  networkFirst: ['generativelanguage.googleapis.com'],
  // Cache first, fallback to network (for static assets)
  cacheFirst: ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.tailwindcss.com'],
  // Stale while revalidate (for app shell)
  staleWhileRevalidate: ['/']
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('hikayati-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Determine cache strategy based on URL
  const isNetworkFirst = CACHE_STRATEGIES.networkFirst.some(domain => url.hostname.includes(domain));
  const isCacheFirst = CACHE_STRATEGIES.cacheFirst.some(domain => url.hostname.includes(domain));
  
  if (isNetworkFirst) {
    // Network first strategy - good for API calls
    event.respondWith(networkFirst(event.request));
  } else if (isCacheFirst) {
    // Cache first strategy - good for fonts and CDN assets
    event.respondWith(cacheFirst(event.request));
  } else {
    // Stale while revalidate - good for app shell
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline fallback if available
    return caches.match('/offline.html');
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// Background sync for offline story saves
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    console.log('[SW] Background sync: stories');
    // Future: sync pending story changes
  }
});
