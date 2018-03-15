const CACHE_PREFIX = `fr.codl.squish@${registration.scope}`;
const CACHE_EPOCH = '1';

function cache_for_hash(hash){
    return `${CACHE_PREFIX}@${CACHE_EPOCH}@${hash}`
}

const VALID_CACHES = Object.values(HASHES).map(cache_for_hash);

const INDEX = 'index.html';

function follow_redirects(resp){
    if(resp.redirected){
        return fetch(resp.url, {cache: 'no-cache', redirect: 'follow'}).then(follow_redirects);
    }
    return resp;
}


self.addEventListener('install', event => {
    promises = []
    for(const [file, hash] of Object.entries(HASHES)){
        const cache_name = cache_for_hash(hash);
        promises.push(
            caches.has(cache_name).then(has_cache => {
                if(!has_cache){
                    return Promise.all([
                        fetch(file, {cache: 'no-cache', redirect: 'follow'})
                        .then(follow_redirects),
                        caches.open(cache_name)
                    ]).then((i) => {
                        const [resp, cache] = i;
                        if(resp.ok){
                            return cache.put(file, resp)
                        }
                        return Promise.reject(resp);
                    });
                }
            })
        )
    }
    event.waitUntil(
        Promise.all(promises).then(skipWaiting)
        .then(() => clients.matchAll({includeUncontrolled: true}))
        .then(client_list => Promise.all(
            client_list.map(client => client.postMessage('update'))
        ))

    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
        .then(cache_names => Promise.all(cache_names.map(name => {
            if(name.startsWith(CACHE_PREFIX) && !VALID_CACHES.includes(name)){
                return caches.delete(name);
            }
        })))
    );
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
