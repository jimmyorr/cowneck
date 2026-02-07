const CACHE_NAME = 'dislikes-v1.0.5';
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
