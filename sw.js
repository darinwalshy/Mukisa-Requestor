// ==========================================
// 🛠️ UNIQUE IDENTIFIERS FOR THIS APP
// ==========================================
const APP_PREFIX = 'mukisa_requester_v2.34_'; // Bumped version to force cache updates
const CACHE_NAME = APP_PREFIX + 'cache';
// Double-check: Make sure this matches your exact GitHub repo casing/spelling (-Requestor vs -Requester)
const REPO_NAME = '/Mukisa-Requestor';      

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

// Activate event: SAFELY selectively filters and purges previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // TIGHTENED: Matches 'mukisa_requester_v' to ensure absolute isolation from other future Mukisa sub-apps
          if (key.startsWith('mukisa_requester_v') && key !== CACHE_NAME) {
            console.log(`[Service Worker] Cleared old app cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch event: BOUNDED NETWORK FIRST with spreadsheet bypass
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // 1. CRITICAL BYPASS: Do not cache or intercept cloud spreadsheet API / Apps Script data
  if (requestUrl.includes('script.google.com') || requestUrl.includes('sheets.googleapis.com')) {
    return; // Let the browser handle the live network request normally
  }

  // 2. Strict local boundary check: Origin matching AND explicit repository subfolder isolation
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
