/**
 * Ellis Web Bell - Service Worker
 * Version: 1.2.0
 * 
 * Provides:
 * - Offline caching of core app files
 * - Background sync capabilities
 * - Install prompt support
 *
 * v1.2.0 changelog (2026-04):
 * - Added /signage/ assets: dashboard.html, dashclock.html, dashright.html, and
 *   the five PNG crests/logo. These are TV-facing pages on Yodeck kiosks where
 *   cache-backed instant reload after network blips genuinely matters.
 * - Bumped CACHE_NAME from v2 -> v3. Every existing client evicts the old cache
 *   on next activate and re-fetches the full CORE_ASSETS list (old cache didn't
 *   know about the signage/ files).
 * - Legacy clock.html stays in the cache list — it's still live on the repo for
 *   any Yodeck frame still pointing at it via URL params. Will remove from cache
 *   in a future version once all frames have migrated to dashclock.html.
 *
 * v1.1.0 changelog (2026-04):
 * - Added clock.html and firebase-config.js to CORE_ASSETS — clock.html now
 *   also registers this service worker, so teachers running the 3x3 grid all
 *   day get cache-backed instant reloads after network blips.
 * - Bumped CACHE_NAME from v1 -> v2 so every existing client evicts the old
 *   cache on next activate (old cache lacked the new files and did not know
 *   to fetch them).
 */

const CACHE_NAME = 'ellis-web-bell-v3';
const CACHE_VERSION = '1.2.0';

// Core files to cache for offline use
const CORE_ASSETS = [
  '/index.html',
  '/clock.html',
  '/styles.css',
  '/script.js',
  '/firebase-config.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // v1.2.0: signage/ family — TV-facing kiosk pages.
  // Note: dashboard-config.html is intentionally NOT cached. It's an admin tool;
  // stale offline copies would be confusing, and it's not on Yodeck TVs anyway.
  '/signage/dashboard.html',
  '/signage/dashclock.html',
  '/signage/dashright.html',
  '/signage/accomodore.png',
  '/signage/callidus.png',
  '/signage/princeps.png',
  '/signage/vevaios.png',
  '/signage/school_logo.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js',
  'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&family=Questrial&display=swap'
];

/**
 * Install event - cache core assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching core assets');
        // Cache core assets - don't fail install if some fail
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[ServiceWorker] Failed to cache: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log(`[ServiceWorker] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - Network first, fall back to cache
 * This ensures fresh content when online, but works offline too
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase/Firestore requests - always go to network
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firestore') ||
      url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // If successful, clone and cache the response
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's a navigation request, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Otherwise return a simple offline response
            return new Response('Offline - Resource not cached', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

/**
 * Handle messages from the main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/**
 * Background sync for when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-bells') {
    // Could be used for syncing local changes when back online
    event.waitUntil(
      // Placeholder for future sync logic
      Promise.resolve()
    );
  }
});

console.log('[ServiceWorker] Loaded - Version:', CACHE_VERSION);
