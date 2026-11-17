/* ============================================================
   sw.js - Service Worker للعمل بدون إنترنت
   ============================================================ */

const CACHE_NAME = 'tournament-app-v4.1';
const RUNTIME_CACHE = 'tournament-runtime-v4.1';

// الملفات الأساسية التي يجب تخزينها
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './theme.js',
    './knockout.js',
    './groups.js',
    './bridge.js',
    './scoresheet.js',
    './bracket.js',
    './dashboard.js',
    './sounds.js',
    './export.js',
    './app.js',
    './manifest.json',
    './sw.js'
];

// مكتبات خارجية (CDN)
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap'
];

// ============ Installation ============
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS).catch(err => {
                    console.warn('[SW] Some assets failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ============ Activation ============
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ============ Fetch (Strategy: Cache First for CDN, Network First for HTML) ============
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // تجاهل طلبات غير GET
    if (request.method !== 'GET') return;

    // تجاهل chrome extensions
    if (url.protocol === 'chrome-extension:') return;

    // تجاهل طلبات blob
    if (url.protocol === 'blob:' || url.protocol === 'data:') return;

    // استراتيجية خاصة للـ HTML: Network First
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
        );
        return;
    }

    // استراتيجية للـ CDN: Cache First
    if (CDN_ASSETS.some(cdn => request.url.includes(cdn))) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // استراتيجية عامة: Cache First, then Network
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(response => {
                // لا تخزن استجابات فاشلة
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE).then(cache => {
                    cache.put(request, responseClone);
                });
                return response;
            }).catch(() => {
                // fallback للصفحة الرئيسية
                if (request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// ============ Message من الصفحة ============
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            Promise.all(names.map(n => caches.delete(n)));
        });
    }
});