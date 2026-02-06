const CACHE_NAME = 'dislikes-v2';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Basic network-first strategy for the app shell, 
    // but we don't cache the API calls (google/youtube)
    if (event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
