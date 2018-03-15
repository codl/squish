const CACHE_VERSION = 'dev5';
const CACHE_PREFIX = `fr.codl.squish-${registration.scope}`;
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const INDEX = 'index.html';
const ASSETS = [ 'main.js' ];
const CACHE_CONTENTS = [ INDEX ].concat(ASSETS);

self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.keys()
                .then(cache_names => Promise.all(cache_names.map(name => {
                    if(name.startsWith(CACHE_PREFIX) && name != CACHE_NAME){
                        return caches.delete(name);
                    }
                }))),
            caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_CONTENTS))
        ]).then(skipWaiting));

});

self.addEventListener('fetch', event => {
    let match;
    if(event.request.url == registration.scope){
        match = caches.match(INDEX);
    } else {
        match = caches.match(event.request);
    }

    event.respondWith(
        match.then(response => {
            if(response) return response;
            return fetch(event.request);
        })
    );
});
