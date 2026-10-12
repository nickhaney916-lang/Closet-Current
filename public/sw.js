'use strict';
const CACHE='closet-current-__VERSION__';
const FILES=__ASSETS__;
const urls=FILES.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('closet-current-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const home=new URL('./',self.registration.scope).href,index=new URL('index.html',self.registration.scope).href;
 const isHome=url.href===home||url.href===index;
 if(!isHome&&!urls.includes(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(event.request);if(response.ok&&!response.redirected&&response.type==='basic')await cache.put(isHome?index:event.request,response.clone());return response;}
  catch{const saved=await cache.match(isHome?index:event.request);return saved||new Response('Reconnect to load Closet Current.',{status:503});}
 })());
});
