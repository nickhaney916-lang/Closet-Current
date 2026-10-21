'use strict';
const CACHE='closet-current-__VERSION__';
const FILES=__ASSETS__;
const urls=FILES.map(path=>new URL(path,self.registration.scope).href);
const allowed=new Set(urls);
const home=new URL('./',self.registration.scope).href;
const index=new URL('index.html',self.registration.scope).href;
// A worker installs only after its entire versioned release has been cached.
// Waiting for older tabs to close uses the native update lifecycle; never
// activate an incomplete collection of CSS, HTML, scripts or model assets.
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith('closet-current-')&&key!==CACHE)
   .map(key=>caches.delete(key))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 // Keep the authenticated customer API, uploads, signed links and all other
 // non-release requests out of the service worker and its Cache Storage.
 const isHome=url.href===home||url.href===index;
 if(!isHome&&!allowed.has(url.href))return;
 event.respondWith((async()=>{
  try{
   const cache=await caches.open(CACHE);
   // Cached, version-locked entrypoints are authoritative. Network-first
   // could overwrite OLD index.html with the NEW page while its OLD JS/CSS
   // files are still in this worker's cache. That silently mixes releases.
   // Never rewrite the immutable install snapshot during ordinary fetches.
   const saved=await cache.match(isHome?index:event.request);
   if(saved)return saved;
  }catch{}
  // An incomplete release must fail closed instead of fetching a current
  // server asset under an old ?v= URL. The browser can recover when a
  // complete replacement worker installs; IndexedDB clothing stays intact.
  return new Response('Closet Current could not load this installed version. Reconnect and reopen the app to update.',{
   status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
  });
 })());
});
