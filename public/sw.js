'use strict';
const VERSION='__VERSION__';
const CACHE='closet-current-'+VERSION;
const FILES=__ASSETS__;
const urls=FILES.map(path=>new URL(path,self.registration.scope).href);
function releaseURL(href){
 const url=new URL(href);
 if(!url.search)url.searchParams.set('v',VERSION);
 return url.href;
}
self.addEventListener('install',event=>{
 const requests=[...new Set(urls.map(releaseURL))].map(url=>new Request(url,{cache:'reload'}));
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(requests)));
});
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
  // Only a newly installed worker can replace this release's asset snapshot.
  const saved=await cache.match(releaseURL(isHome?index:url.href));
  return saved||new Response('Reload to load Closet Current.',{status:503});
 })());
});
