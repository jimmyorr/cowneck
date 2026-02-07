importScripts('version.js');
const CACHE_NAME = `dislikes-v${APP_VERSION}`;
const ASSETS = [
    './',
    './index.html',
    './version.js',
    './app.js',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', (event) => {
    // Force this SW to activate immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    // Take control of all open clients immediately
    event.waitUntil(clients.claim());

    // Delete old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('dislikes-v')) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Basic network-first strategy for the app shell, 
    // Exclude API calls and Google scripts from caching/interception
    const exclusions = [
        'googleapis.com',
        'apis.google.com',
        'accounts.google.com',
        'gstatic.com'
    ];
    if (exclusions.some(domain => event.request.url.includes(domain))) {
        return;
    }

    event.respondWith(
        (async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            try {
                const response = await fetch(event.request, { signal: controller.signal });
                clearTimeout(timeoutId);
                return response;
            } catch (err) {
                clearTimeout(timeoutId);
                const cached = await caches.match(event.request);
                if (cached) return cached;
                throw err;
            }
        })()
    );
});
