/* PLAYIT 2 test-only app shell cache; API and private data never cached. */
const CACHE='playit2-shell-v20';
const ASSETS=['./','./catalog.css?v=17','./catalog.js?v=28','./cinema-plus.css?v=5','./cinema-plus.js?v=13','./retro-phone.js?v=9','./retro-phone.css?v=11','./swipe-fix.js?v=7','./swipe-fix.css?v=5'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()).catch(()=>{})));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('playit2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const r=event.request;const u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith('/beosztas/playit2/'))return;if(r.mode==='navigate'){event.respondWith(fetch(r).catch(()=>caches.match('./')));return;}event.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(response=>{if(response.ok&&/\.(?:css|js|svg|png)(?:\?|$)/.test(u.pathname)){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(r,copy));}return response;})));});
