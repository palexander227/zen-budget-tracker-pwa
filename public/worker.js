// Flag for enabling cache in production
var doCache = true;

var CACHE_NAME = 'transactions-cache';
const assets = [
    "/index.html",
    "/index.js",
    "/chart.js",
    "/styles.css",
    "/worker.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

self.addEventListener('activate', event => {
    const currentCacheList = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then(keyList =>
                Promise.all(keyList.map(key => {
                    if (!currentCacheList.includes(key)) {
                        return caches.delete(key);
                    }
                    return;
                }))
            )
    );
});

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(assets)
        })
    )
});

self.addEventListener("fetch", event => {
    if (event.request.method === 'GET')
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return fetch(event.request).then(response => {
                    cache.put(event.request, response.clone());
                    return response;
                }).catch(() => caches.match(event.request));
            })  
        );
});