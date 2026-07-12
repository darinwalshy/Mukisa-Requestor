// ==========================================
// 🛠️ UNIQUE IDENTIFIERS FOR THIS APP
// ==========================================
const APP_PREFIX = 'boilerplate_v2_2_'; // Change this for every new project!
const CACHE_NAME = APP_PREFIX + 'cache';
const REPO_NAME = '/Boilerplate';       // Change to match your exact GitHub repository name

const ASSETS = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/manifest.json`
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate event: SAFELY selectively filters caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // CRITICAL FIX: Only delete caches belonging to THIS specific app prefix
          if (key.startsWith(APP_PREFIX) && key !== CACHE_NAME) {
            console.log(`[Service Worker] Cleared old app cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch event: STRICT SCOPED NETWORK FIRST with immediate cache fallback
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Strict local boundary check: Origin matching AND explicit repository subfolder isolation
  if (requestUrl.includes(self.location.origin) && requestUrl.includes(REPO_NAME)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          // Fall back to specific namespaced index if individual asset is missing offline
          return response || caches.match(`${REPO_NAME}/index.html`);
        });
      })
    );
  }
});
