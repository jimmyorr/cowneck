const CACHE_NAME = 'dislikes-v1.0.6';
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
