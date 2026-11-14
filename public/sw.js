/* AFTERHOURS shell only. No third-party responses or runtime game files cached. */
const CACHE='afterhours-shell-v1';
const SHELL=self.__SHELL_ASSETS__||['/','/index.html','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('afterhours-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{const request=event.request;const url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/games/'))return;const key=request.mode==='navigate'?'/index.html':url.pathname;if(!SHELL.includes(key))return;event.respondWith(request.mode==='navigate'?fetch(request).then(response=>{if(response.ok){const copy=response.clone();void caches.open(CACHE).then(c=>c.put('/index.html',copy));}return response;}).catch(()=>caches.match('/index.html').then(r=>r||Response.error())):caches.match(key).then(cached=>cached||fetch(request)));});
