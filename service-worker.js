/**
 * Ellis Web Bell - Service Worker
 * Version: 1.11.0
 *
 * v1.11.0 changelog (2026-07, app 6.4.0): + 28-presence.js +
 *   29-admin-dashboard.js (usage dashboard, design Layer 1).
 *
 * v1.10.0 changelog (2026-07, app 6.3.0): + school-config.js +
 *   27-school-branding.js (schoolification pass).
 *
 * v1.9.0 changelog (2026-07, app 6.2.0): + 26-modal-chrome.js (Stage 6b
 *   shared modal chrome); cache bump busts 6.1.0 caches.
 *
 * v1.8.0 changelog (2026-07, app 6.1.0):
 * - Tone.js is now SELF-HOSTED (/tone.min.js, added to CORE_ASSETS) instead
 *   of cdnjs. Last CDN runtime dependency gone (gstatic Firebase SDKs remain
 *   by design — they're not cacheable app assets). Offline mode is now
 *   honest: the bell sound engine loads with no network at all.
 * - CACHE_NAME is now DERIVED from CACHE_VERSION ('ellis-web-bell-' +
 *   CACHE_VERSION). One bump instead of two: any SW release automatically
 *   busts the cache. The activate handler already evicts every cache whose
 *   name differs, so the old 'ellis-web-bell-v8' is cleaned up on first
 *   activation.
 * - `npm run check:sw` (build/verify-sw.mjs) now verifies CORE_ASSETS
 *   against the filesystem: every listed asset exists, every src/js module
 *   is listed. Run it whenever this file or src/js/ contents change.
 *
 * v1.7.1 changelog (2026-07, app 6.0.1):
 * - Version-number correction: the modularization release was mislabeled
 *   7.0.0; it is 6.0.0.
 * - BUG FIX: CACHE_VERSION (what GET_VERSION reports to the status modal)
 *   was left at '1.6.0' when the header went to 1.7.0. Now matches the
 *   header, and must be bumped together with it from here on.
 * - CACHE_NAME stays v8 (CORE_ASSETS unchanged).
 *
 * v1.7.0 changelog (2026-07, app 6.0.0):
 * - script.js retired: the app is now native ES modules served from src/js/.
 *   Removed /script.js from CORE_ASSETS; added all 29 /src/js/*.js modules.
 *   RULE: any new module in src/js/ must be added to CORE_ASSETS AND
 *   CACHE_NAME must be bumped, or offline loads will miss it.
 * - Bumped CACHE_NAME v7 -> v8.
 *
 * v1.6.0 changelog (2026-07):
 * - Added /signage/schedule-utils.js to CORE_ASSETS (new shared logic for
 *   the three TV signage pages: relative-bell resolution + emergency-shift
 *   support; loads after bell-engine.js).
 * - Bumped CACHE_NAME v6 -> v7.
 *
 * v1.5.0 changelog (2026-07):
 * - Added /bell-engine.js to CORE_ASSETS (new shared time/schedule math,
 *   required by index.html and clock.html before their own logic runs).
 * - Bumped CACHE_NAME v5 -> v6.
 *
 * v1.4.0 changelog (2026-07):
 * - Tailwind is now a compiled, self-hosted /tailwind.css (added to
 *   CORE_ASSETS) instead of the cdn.tailwindcss.com runtime JIT (removed from
 *   EXTERNAL_ASSETS and the opaque allowlist). ~30KB static CSS replaces a
 *   ~380KB script that recompiled styles in the browser on every load.
 * - Bumped CACHE_NAME v4 -> v5.
 *
 * v1.3.0 changelog (2026-07):
 * - EXTERNAL_ASSETS (Tailwind CDN, Tone.js, Google Fonts CSS) are now actually
 *   precached. The constant existed since v1.0 but was never referenced in the
 *   install handler, so offline loads got the app shell with no styling and no
 *   audio engine. They're fetched as no-cors Requests, which yields opaque
 *   responses -- fine for <script>/<link> consumption offline.
 * - Runtime cache now also stores opaque (cross-origin no-cors) responses from
 *   an allowlist of CDN hosts (cdn.tailwindcss.com, cdnjs.cloudflare.com,
 *   fonts.googleapis.com, fonts.gstatic.com). Previously the status === 200
 *   check silently excluded ALL of them (opaque responses report status 0),
 *   so font files etc. never entered the cache.
 * - Added /ellisBell.mp3 to CORE_ASSETS so the default bell sound works offline
 *   on first day, not just after the first ring populated the runtime cache.
 * - Bumped CACHE_NAME v3 -> v4.
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

const CACHE_VERSION = '1.11.0';
// v1.8.0: derived — bumping CACHE_VERSION is the ONLY bump needed; the
// activate handler evicts every cache whose name differs from this one.
const CACHE_NAME = 'ellis-web-bell-' + CACHE_VERSION;

// Core files to cache for offline use
const CORE_ASSETS = [
  '/index.html',
  '/clock.html',
  '/styles.css',
  '/tailwind.css',
  '/tone.min.js', // v1.8.0: self-hosted (was cdnjs)
  // v1.7.0 (app 6.0.0): script.js retired; src/js/ modules ARE production.
  // Keep this list in sync with src/js/ — adding a module = add it here +
  // bump CACHE_VERSION (CACHE_NAME derives from it). `npm run check:sw` verifies.
  '/src/js/00-header.js',
  '/src/js/01-firebase-imports.js',
  '/src/js/02-dom-elements.js',
  '/src/js/03-memory-management.js',
  '/src/js/04-app-state-and-bells.js',
  '/src/js/05-preferences-cloud-sync.js',
  '/src/js/06-warning-effects.js',
  '/src/js/07-kiosk-mode.js',
  '/src/js/08-theme-and-display.js',
  '/src/js/09-picture-in-picture.js',
  '/src/js/10-clock-engine.js',
  '/src/js/11-quick-bell-broadcast.js',
  '/src/js/12-quick-bell-queue.js',
  '/src/js/13-schedule-resolution-and-ringing.js',
  '/src/js/14-render-schedule-list.js',
  '/src/js/15-firebase-init.js',
  '/src/js/16-schedule-management.js',
  '/src/js/17-share-codes.js',
  '/src/js/18-bell-crud-and-modals.js',
  '/src/js/19-visual-cues-and-files.js',
  '/src/js/20-schedule-calendar.js',
  '/src/js/21-emergency-shift.js',
  '/src/js/22-audit-log.js',
  '/src/js/23-clock-drift.js',

  '/src/js/24-notifications.js',
  '/src/js/25-status-view.js',
  '/src/js/26-modal-chrome.js', // v1.9.0 (app 6.2.0, Stage 6b)
  '/src/js/27-school-branding.js', // v1.10.0 (app 6.3.0, schoolification)
  '/src/js/28-presence.js', // v1.11.0 (app 6.4.0, presence)
  '/src/js/29-admin-dashboard.js', // v1.11.0 (app 6.4.0, presence)
  '/src/js/99-init-and-listeners.js',
  '/src/js/main.js',
  '/src/js/state.js',
  '/firebase-config.js',
  '/school-config.js', // v1.10.0 (app 6.3.0, schoolification)
  '/bell-engine.js',
  '/manifest.json',
  '/ellisBell.mp3',
  '/icon-192.png',
  '/icon-512.png',
  // v1.2.0: signage/ family — TV-facing kiosk pages.
  // Note: dashboard-config.html is intentionally NOT cached. It's an admin tool;
  // stale offline copies would be confusing, and it's not on Yodeck TVs anyway.
  '/signage/schedule-utils.js',
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
        // Cache core assets - don't fail install if some fail.
        // v1.3.0: EXTERNAL_ASSETS are fetched no-cors; the resulting opaque
        // responses serve <script>/<link> tags offline just fine.
        const coreRequests = CORE_ASSETS.map(url => new Request(url));
        const externalRequests = EXTERNAL_ASSETS.map(url => new Request(url, { mode: 'no-cors' }));
        return Promise.allSettled(
          [...coreRequests, ...externalRequests].map(request =>
            cache.add(request).catch(err => {
              console.warn(`[ServiceWorker] Failed to cache: ${request.url}`, err);
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
        // If successful, clone and cache the response.
        // v1.3.0: opaque responses (cross-origin no-cors, status 0) from our
        // known CDNs are cacheable and needed for offline styling/audio/fonts.
        const OPAQUE_ALLOWLIST = [
          'cdnjs.cloudflare.com',
          'fonts.googleapis.com',
          'fonts.gstatic.com'
        ];
        const isAllowedOpaque = response && response.type === 'opaque' &&
          OPAQUE_ALLOWLIST.includes(url.hostname);
        if (response && (response.status === 200 || isAllowedOpaque)) {
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
